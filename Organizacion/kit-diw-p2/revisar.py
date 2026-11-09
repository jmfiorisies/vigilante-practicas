#!/usr/bin/env python3
"""
revisar.py — (DOCENTE) corrige la ENTREGA de la P2 de DIW pasando NUESTRO comprobador al proyecto de cada alumno.

Para cada alumno de GestionDocente/Alumnos/DIW/repos (haz antes ./actualizar.sh):
  1. Elige el commit: el último de main (o master), o el último ANTES de --hasta (la entrega es una
     sola, la noche antes de la defensa: --hasta "2026-11-23 23:59").
  2. Encuentra su proyecto (la carpeta que tiene scss/components/_tarjeta-planta.scss, mejor si está en p2-raiz/)
     y copia sus páginas, su scss/, su src/, su public/ y su GUIA-ESTILO.md a un proyecto limpio (.runner/) con
     NUESTRO comprobador, NUESTRAS fuentes/ y NUESTRA configuración de Stylelint y Prettier (plantilla/).
     Avisa si ha cambiado el comprobador o las fuentes.
  3. Ejecuta el comprobador (--json), con Stylelint y Prettier, EN DOCKER (node:22-alpine; nada instalado).
  4. Con --acordeon (y Chrome sin ventana: Moodle/chrome-auto.sh start), la prueba del acordeón de las cuatro
     páginas, de 320 a 1440 px: sale en Observaciones (no suma ni resta: se pregunta en la defensa).

  AVANCES (parte de la rúbrica): en cada fecha de avance (HITOS, abajo) se hace una FOTO de lo que hay
  subido del bloque de esa fecha: su rama feature/p2-X (o develop, o main), último commit antes de la fecha, solo
  las comprobaciones de ese bloque. Hazla LA MAÑANA SIGUIENTE, tras ./actualizar.sh: lo que no estuviera
  subido entonces no cuenta, aunque luego aparezca con una fecha anterior (las fechas de git se pueden
  falsear; la foto no). Se guarda en Alumnos/DIW/P2-avance-X.json y la nota final la usa.

  Nota de cada bloque (sobre 10): comprobaciones del bloque 5 p (sin las 👀 del ejemplo resuelto)
    + AVANCE en su fecha 2,5 p (verdes del bloque en la foto ÷ total)
    + Stylelint sin errores 0,5 p + Prettier 0,5 p + rama feature/p2-X fusionada en develop y, con develop, en main 1,5 p.
    (Stylelint, Prettier y la rama solo suman si el bloque tiene al menos la mitad en verde.)
    Nota de la ENTREGA = media de A, B y C (30 % de la práctica; el 70 % es la defensa).

  Uso (todo en Docker: revisar.sh lanza este script dentro de un contenedor):
        bash revisar.sh --avance a                         → la foto del 05/11 (la mañana del 06/11)
        bash revisar.sh --hasta "2026-11-23 23:59"         → la entrega, con los avances
        bash revisar.sh --hasta "2026-11-23 23:59" --acordeon   → y la prueba del acordeón en Chrome
        bash revisar.sh --parte b ana luis                 → solo ese bloque y esos alumnos
        bash revisar.sh --repos /otra/carpeta              → otros repos (el informe va al lado)
        bash revisar.sh --progreso                         → avance semana a semana para el planificador

Escribe Alumnos/DIW/P2.md (o P2-bloque-X.md con --parte) y la entrega para la app de defensas
(docs/defensa/practicas/diw-p2-entregas.json). No toca los repos.
"""
import argparse, io, json, os, shutil, subprocess, sys, tarfile
from pathlib import Path

AQUI = Path(__file__).resolve().parent
REPOS = AQUI.parents[1] / "Alumnos/DIW/repos"
RUNNER = AQUI / ".runner"
PLANTILLA = AQUI / "plantilla"
IMG = AQUI / "solucion/public/img"   # las imágenes generadas (no están en git): solo para el 👀 y el acordeón
IMAGEN = "node:22-alpine"
MARCA = "scss/components/_tarjeta-planta.scss"   # el fichero que identifica su proyecto

# Cada bloque: la rama en la que se trabaja (se mira que esté fusionada en develop y en main)
BLOQUES = {"A": "feature/p2-a", "B": "feature/p2-b", "C": "feature/p2-c"}
# Fechas de avance (al acabar cada unidad). Lo subido de ese bloque hasta esa hora puntúa.
HITOS = {"A": "2026-11-05 23:59", "B": "2026-11-12 23:59", "C": "2026-11-19 23:59"}
PESOS = {"comprobador": 5, "avance": 2.5, "stylelint": 0.5, "prettier": 0.5, "rama": 1.5}   # 31/10: más proceso, menos resultado
# Lo que se copia de su proyecto; lo demás (comprobador, fuentes, configuración) es nuestro
SUYO = ["index.html", "producto.html", "creditos.html", "contacto.html", "scss", "src", "public", "GUIA-ESTILO.md"]
NUESTRO = ["comprobador", "fuentes", "package.json", "package-lock.json", ".stylelintrc.json", ".prettierrc.json",
           "vite.config.mjs"]
ALUMNOS_TSV = AQUI.parents[1] / "Alumnos/DIW/alumnos.tsv"
ENTREGAS_APP = AQUI.parent / "docs/defensa/practicas/diw-p2-entregas.json"


def git(repo, *args, binario=False):
    r = subprocess.run(["git", "-C", str(repo), *args], capture_output=True)
    return r.stdout if binario else r.stdout.decode(errors="replace").strip()


def docker(*orden, timeout=None, red=False):
    """Ejecuta una orden en node:22-alpine con .runner montado en /app y nuestros permisos."""
    extra = ["--network", "host"] if red else []
    return subprocess.run(["docker", "run", "--rm", *extra, "-u", f"{os.getuid()}:{os.getgid()}",
                           "-e", "TZ=Europe/Madrid", "-e", "HOME=/tmp", "-e", "npm_config_cache=/tmp/npm",
                           "-v", f"{RUNNER}:/app", "-w", "/app", IMAGEN, *orden],
                          capture_output=True, timeout=timeout)


def preparar_runner():
    """node_modules con las dependencias de la plantilla (se rehace si cambia el package-lock) e imágenes."""
    RUNNER.mkdir(exist_ok=True)
    lock = (PLANTILLA / "package-lock.json").read_bytes()
    if not ((RUNNER / "node_modules").exists() and (RUNNER / "package-lock.json").exists()
            and (RUNNER / "package-lock.json").read_bytes() == lock):
        for f in ("package.json", "package-lock.json"):
            shutil.copy(PLANTILLA / f, RUNNER / f)
        print("Instalando dependencias en .runner/ con Docker (solo cuando cambian)…")
        r = docker("npm", "ci", "--no-audit", "--no-fund")
        if r.returncode:
            sys.exit("No se ha podido preparar .runner/: " + r.stderr.decode()[-400:])
    if not IMG.exists() or len(list(IMG.iterdir())) < 45:
        sys.exit(f"Faltan las imágenes en {IMG}: cd solucion && docker compose run --rm web npm run imagenes")


def ramas_de(repo):
    return git(repo, "for-each-ref", "--format=%(refname:short)", "refs/heads").split()


def elegir_ref(repo, rama, hasta):
    # La entrega es main; en los avances, su feature/p2-X o, si no existe, lo que ya haya fusionado en develop
    candidatas = [rama, "main", "master"] if rama in ("main", "master") else [rama, "develop", "main", "master"]
    for r in candidatas:
        if r in ramas_de(repo):
            if hasta:
                c = git(repo, "rev-list", "-1", f"--before={hasta}", r)
                return (r, c) if c else (r, None)
            return r, git(repo, "rev-parse", r)
    return None, None


def extraer(repo, commit, base, rutas, destino):
    """Copia las rutas (relativas a su proyecto) de ese commit dentro de destino."""
    existentes = [r for r in rutas if subprocess.run(["git", "-C", str(repo), "cat-file", "-e", f"{commit}:{base}{r}"],
                                                       capture_output=True).returncode == 0]
    if not existentes:
        return
    tar = git(repo, "archive", commit, *[base + r for r in existentes], binario=True)
    with tarfile.open(fileobj=io.BytesIO(tar)) as tf:
        for m in tf.getmembers():
            if m.isfile():
                f = destino / m.name[len(base):]
                f.parent.mkdir(parents=True, exist_ok=True)
                f.write_bytes(tf.extractfile(m).read())


def limpiar_runner():
    """Deja .runner/ con NUESTRO proyecto base (sin nada suyo) y las imágenes generadas."""
    for d in SUYO + NUESTRO + ["dist"]:
        if d in ("package.json", "package-lock.json"):
            continue
        p = RUNNER / d
        shutil.rmtree(p, ignore_errors=True) if p.is_dir() else p.unlink(missing_ok=True)
    for d in NUESTRO:
        if d in ("package.json", "package-lock.json"):
            continue
        origen = PLANTILLA / d
        shutil.copytree(origen, RUNNER / d) if origen.is_dir() else shutil.copy(origen, RUNNER / d)


def revisar(repo, bloques, rama, hasta, foto=False, acordeon=False):
    """foto=True: solo las comprobaciones (sin Stylelint, Prettier ni ramas), para las fotos de avance."""
    ref, commit = elegir_ref(repo, rama, hasta)
    fila = {"alumno": repo.name, "rama": ref or "—", "commit": (commit or "")[:7], "grupos": {}, "obs": [], "rojos": []}
    if not commit:
        fila["obs"].append("sin rama/commit")
        return fila
    if ref != rama:
        fila["obs"].append(f"no hay {rama}: uso {ref}")
    marcas = [f for f in git(repo, "ls-tree", "-r", "--name-only", commit).splitlines()
              if f.endswith(MARCA) and "node_modules" not in f]
    if not marcas:
        fila["obs"].append(f"no hay {MARCA}")
        return fila
    marcas.sort(key=lambda f: ("p2-raiz/" not in f, len(f)))   # mejor la de p2-raiz/
    base = marcas[0][: -len(MARCA)]

    # ¿Ha tocado nuestro comprobador o las fuentes?
    for f in ["comprobador/comprobar.mjs", "fuentes/LICENCIAS.md"]:
        suyo = git(repo, "show", f"{commit}:{base}{f}", binario=True)
        if suyo and suyo.replace(b"\r\n", b"\n") != (PLANTILLA / f).read_bytes():
            fila["obs"].append(f"⚠️ ha cambiado {f}")

    # Proyecto limpio: lo suyo + lo nuestro + las imágenes generadas
    limpiar_runner()
    extraer(repo, commit, base, SUYO, RUNNER)
    shutil.rmtree(RUNNER / "public/img", ignore_errors=True)
    shutil.copytree(IMG, RUNNER / "public/img")

    args = ["node", "comprobador/comprobar.mjs", "--json"] + (["--sin-calidad"] if foto else [])
    try:
        r = docker(*args, timeout=240)
    except subprocess.TimeoutExpired:
        fila["obs"].append("💥 tiempo agotado")
        return fila
    try:
        datos = json.loads(r.stdout)
    except json.JSONDecodeError:
        fila["obs"].append("💥 el comprobador no ha podido ejecutarse: " + r.stderr.decode()[-120:].strip())
        return fila
    for x in datos["resultados"]:
        if x["bloque"] == "0":
            if not x["ok"]:
                fila["obs"].append(f"💥 {x['texto'][2:]}")
            continue
        if x["bloque"] not in bloques:
            continue
        g = f"{x['bloque']}/{x['ap']}"
        ok, total = fila["grupos"].get(g, (0, 0))
        fila["grupos"][g] = (ok + x["ok"], total + 1)
        if not x["ok"]:
            fila["rojos"].append(f"{x['ap']} · {x['texto']}")

    if not foto:
        fila["stylelint"] = bool(datos["calidad"] and datos["calidad"]["stylelint"])
        fila["prettier"] = bool(datos["calidad"] and datos["calidad"]["prettier"])
        ramas = ramas_de(repo)
        contenida = lambda rama, en: subprocess.run(
            ["git", "-C", str(repo), "merge-base", "--is-ancestor", rama, en]).returncode == 0
        fila["fusionadas"] = {
            b: BLOQUES[b] in ramas and "develop" in ramas
               and contenida(BLOQUES[b], "develop") and contenida(BLOQUES[b], commit)
            for b in bloques}
    if acordeon:
        prueba_acordeon(fila)
    return fila


def prueba_acordeon(fila):
    """vite build de su proyecto, vite preview en :4173 y acordeon.mjs contra el Chrome sin ventana (:9222)."""
    if docker("npx", "vite", "build", timeout=180).returncode:
        fila["obs"].append("💥 vite build falla")
        return
    shutil.copy(AQUI / "acordeon.mjs", RUNNER / "acordeon.mjs")
    servidor = subprocess.Popen(["docker", "run", "--rm", "--name", "diw-p2-preview", "--network", "host",
                                 "-u", f"{os.getuid()}:{os.getgid()}", "-v", f"{RUNNER}:/app", "-w", "/app", IMAGEN,
                                 "npx", "vite", "preview", "--host", "127.0.0.1", "--port", "4173", "--strictPort"],
                                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        r = docker("node", "acordeon.mjs", "http://127.0.0.1:4173", timeout=180, red=True)
        try:
            res = json.loads(r.stdout)
        except json.JSONDecodeError:
            fila["obs"].append("💥 acordeón: " + (r.stderr.decode().strip().splitlines() or ["sin salida"])[-1][:100])
            return
        fila["acordeon"] = res
        rotas = {p: v for p, v in res.items() if v}
        if rotas:
            fila["obs"].append("desborda: " + ", ".join(f"{p} {v[0]}{'…' + str(v[-1]) if len(v) > 1 else ''} px"
                                                       for p, v in rotas.items()))
    finally:
        subprocess.run(["docker", "stop", "-t", "1", "diw-p2-preview"], capture_output=True)
        servidor.wait()


# ------------------------------------------------------------------------------ notas e informe
coma = lambda x: f"{x:.1f}".replace(".", ",")
celda = lambda f, g: f"{f['grupos'][g][0]}/{f['grupos'][g][1]}" if g in f["grupos"] else "—"


def verdes(f, bloque):
    """(verdes, total) de las comprobaciones de ese bloque (sin las 👀)."""
    gs = [g for g in f["grupos"] if g.startswith(bloque + "/")]
    return sum(f["grupos"][g][0] for g in gs), sum(f["grupos"][g][1] for g in gs)


def ruta_avance(repos, bloque):
    return repos.parent / f"P2-avance-{bloque.lower()}.json"


def avance(repos, bloque, alumno):
    """Fracción (0–1) del bloque en verde en su fecha, según la foto; None si no hay foto."""
    ruta = ruta_avance(repos, bloque)
    if not ruta.exists():
        return None
    d = json.loads(ruta.read_text()).get("alumnos", {}).get(alumno)
    return d["ok"] / d["total"] if d and d.get("total") else 0.0


def nota_bloque(f, bloque, av):
    ok, total = verdes(f, bloque)
    if not total:
        return None
    # Stylelint, Prettier y la rama solo cuentan con el bloque hecho al menos a medias (un bloque vacío está «limpio»)
    hecho = ok >= total / 2
    return (PESOS["comprobador"] * ok / total + PESOS["avance"] * (av or 0)
            + hecho * (PESOS["stylelint"] * f.get("stylelint", False) + PESOS["prettier"] * f.get("prettier", False)
                       + PESOS["rama"] * f.get("fusionadas", {}).get(bloque, False)))


def acordeon(f):
    if "acordeon" not in f:
        return "—"
    rotas = [p for p, v in f["acordeon"].items() if v]
    return "✓" if not rotas else "✗ " + ", ".join(rotas)


def informe(filas, bloques, a):
    sin_foto = [b for b in bloques if not ruta_avance(a.repos, b).exists()]
    lineas = ["# DIW P2 · RAÍZ, vivero online — corrección automática de la entrega", "",
              f"Rama: `{a.rama}`" + (f" · commits hasta {a.hasta}" if a.hasta else ""), "",
              "Nota de cada bloque = comprobaciones del bloque 5 p + avance en su fecha 2,5 p + Stylelint 0,5 p"
              " + Prettier 0,5 p + rama `feature/p2-X` fusionada en `develop` y en `main` 1,5 p (estos tres, solo con la mitad"
              " del bloque en verde). **Entrega** = media de"
              " los bloques (30 % de la práctica; la defensa, el 70 %, va aparte). El acordeón (320–1440 px) no puntúa:"
              " si sale en Observaciones, pregúntalo en la defensa.", ""]
    if sin_foto:
        lineas += [f"⚠️ Sin foto de avance de: {', '.join(sin_foto)} (`--avance`): ese avance cuenta 0.", ""]
    lineas += ["| Alumno | Commit | " + " | ".join(f"{b}: compr. · avance · rama · **nota**" for b in bloques)
               + " | Stylelint | Prettier | Acordeón | **Entrega** | Observaciones |",
               "|---|---|" + ":-:|" * (len(bloques) + 4) + "---|"]
    for f in filas:
        celdas, notas = [], []
        for b in bloques:
            ok, total = verdes(f, b)
            av = avance(a.repos, b, f["alumno"])
            n = nota_bloque(f, b, av)
            f.setdefault("notas", {})[b] = n
            notas.append(n or 0)
            celdas.append(f"{ok}/{total} · {'—' if av is None else f'{round(100 * av)} %'}"
                          f" · {'✓' if f.get('fusionadas', {}).get(b) else '✗'} · **{coma(n) if n is not None else '—'}**")
        f["media"] = sum(notas) / len(notas)
        lineas.append(f"| {f['alumno']} | {f['commit']} | " + " | ".join(celdas)
                      + f" | {'✓' if f.get('stylelint') else '✗'} | {'✓' if f.get('prettier') else '✗'}"
                      f" | {acordeon(f)} | **{coma(f['media'])}** | {'; '.join(f['obs'])} |")
    detalle = sorted({g for f in filas for g in f["grupos"]})
    lineas += ["", "## Detalle por apartado", "",
               "| Alumno | " + " | ".join(detalle) + " |", "|---|" + ":-:|" * len(detalle)]
    for f in filas:
        lineas.append(f"| {f['alumno']} | " + " | ".join(celda(f, g) for g in detalle) + " |")
    lineas += ["", "## Lo que tiene en rojo (para preparar la defensa)", ""]
    for f in filas:
        if f["rojos"]:
            lineas += [f"**{f['alumno']}**", ""] + [f"- {r}" for r in f["rojos"]] + [""]
    nombre = "P2.md" if len(bloques) == len(BLOQUES) else f"P2-bloque-{bloques[0].lower()}.md"
    destino = a.repos.parent / nombre
    destino.write_text("\n".join(lineas) + "\n")
    print(f"\n→ {destino}")
    if len(bloques) == len(BLOQUES) and a.repos == REPOS:
        para_la_app(filas)


def para_la_app(filas):
    """La entrega, para la app de defensas: {nombre: {verdes, nota, fallos, avisos}} (nombres de alumnos.tsv)."""
    nombres = {}
    if ALUMNOS_TSV.exists():
        for linea in ALUMNOS_TSV.read_text().splitlines()[1:]:
            c = linea.split("\t")
            if len(c) >= 2:
                nombres[c[1]] = c[0]
    datos = {}
    for f in filas:
        datos[nombres.get(f["alumno"], f["alumno"])] = {
            "verdes": sum(verdes(f, b)[0] for b in BLOQUES), "nota": round(f["media"], 2), "fallos": f["rojos"][:40],
            "avisos": f["obs"] + [f"{b}: {coma(n)}" for b, n in f["notas"].items() if n is not None]}
    ENTREGAS_APP.write_text(json.dumps(datos, ensure_ascii=False, indent=1) + "\n")
    print(f"→ {ENTREGAS_APP} (para la app de defensas; se sube con publicar.sh y tu orden)")


def foto_avance(repos, bloque, alumnos):
    """La foto de una fecha de avance: las comprobaciones del bloque en su rama, hasta la fecha."""
    filas = {}
    for repo in repos:
        f = revisar(repo, [bloque], BLOQUES[bloque], HITOS[bloque], foto=True)
        ok, total = verdes(f, bloque)
        filas[repo.name] = {"rama": f["rama"], "commit": f["commit"], "ok": ok, "total": total, "obs": f["obs"]}
        print(f"{repo.name:18} {f['rama']:16} {f['commit']:8} {ok}/{total} {'; '.join(f['obs'])}")
    ruta = ruta_avance(repos[0].parent if repos else REPOS, bloque)
    viejo = json.loads(ruta.read_text())["alumnos"] if ruta.exists() and alumnos else {}
    viejo.update(filas)
    ruta.write_text(json.dumps({"bloque": bloque, "hasta": HITOS[bloque], "alumnos": viejo},
                               ensure_ascii=False, indent=1) + "\n")
    print(f"\n→ {ruta}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("alumnos", nargs="*")
    ap.add_argument("--parte", choices=["a", "b", "c", "todo"], default="todo", help="un bloque o todos (por defecto)")
    ap.add_argument("--rama", default="main", help="la rama que se corrige (por defecto main)")
    ap.add_argument("--repos", type=Path, default=REPOS, help="carpeta con los repos (por defecto Alumnos/DIW/repos)")
    ap.add_argument("--hasta", help='p. ej. "2026-11-23 23:59": último commit antes de esa hora')
    ap.add_argument("--avance", choices=["a", "b", "c"], help="hace la FOTO de la fecha de avance de ese bloque")
    ap.add_argument("--acordeon", action="store_true", help="prueba del acordeón en Chrome (chrome-auto.sh start)")
    ap.add_argument("--progreso", action="store_true", help="avance semana a semana (pestaña Repositorios del planificador)")
    ap.add_argument("--desde", default="2026-10-17", help="con --progreso: desde qué día")
    a = ap.parse_args()
    a.repos = a.repos.resolve()
    bloques = list(BLOQUES) if a.parte == "todo" else [a.parte.upper()]
    preparar_runner()
    repos = sorted(p for p in a.repos.iterdir() if (p / ".git").exists())
    if a.alumnos:
        repos = [p for p in repos if p.name in a.alumnos]
    if a.avance:
        return foto_avance(repos, a.avance.upper(), a.alumnos)
    if a.progreso:                                       # avance semana a semana (../tools/progreso.py)
        sys.path.insert(0, str(AQUI.parent / "tools"))
        import progreso

        def comprobar(repo, rama, hasta):
            f = revisar(repo, list(BLOQUES), rama, hasta, foto=True)
            return f["rama"], f["commit"], {g.split("/")[-1]: v for g, v in f["grupos"].items()}, f["obs"]
        return progreso.ejecutar("diw-p2", repos, comprobar, a.repos.parent / "P2-progreso.json", a.desde,
                                 "2026-11-23", progreso.firma(PLANTILLA / "comprobador"), HITOS)
    filas = []
    for repo in repos:
        f = revisar(repo, bloques, a.rama, a.hasta, acordeon=a.acordeon)
        filas.append(f)
        g = " ".join(f"{k}:{v[0]}/{v[1]}" for k, v in sorted(f["grupos"].items()))
        print(f"{f['alumno']:18} {f['rama']:10} {f['commit']:8} {g:70} {'; '.join(f['obs'])}")
    informe(filas, bloques, a)


if __name__ == "__main__":
    sys.exit(main())
