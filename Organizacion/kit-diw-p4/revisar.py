#!/usr/bin/env python3
"""
revisar.py — (DOCENTE) corrige la ENTREGA de la P4 de DIW (Cita Fácil) pasando NUESTRO comprobador al proyecto de cada
alumno.

Para cada alumno de GestionDocente/Alumnos/DIW/repos (haz antes ./actualizar.sh):
  1. Elige el commit: el último de main (o master), o el último ANTES de --hasta (la entrega es una sola:
     --hasta "2027-02-01 23:59").
  2. Encuentra su proyecto (la carpeta que tiene src/datos/huecos.js, mejor si está en p4-cita-facil/) y copia sus
     cuatro páginas, su scss/, su src/, su public/ y sus cinco .md a un proyecto limpio (.runner/) con NUESTRO
     comprobador, NUESTROS datos y sesiones.md y NUESTRA configuración de Stylelint y Prettier (plantilla/). Avisa si ha
     cambiado el comprobador o los datos.
  3. Ejecuta el comprobador (--json), Stylelint y Prettier, EN DOCKER (node:22-alpine; nada instalado).

  AVANCES: en cada fecha de avance (HITOS) se hace una FOTO de lo subido del bloque de esa fecha: su rama feature/p4-X
  (o develop, o main), último commit antes de la fecha, solo las comprobaciones de ese bloque. Hazla LA MAÑANA
  SIGUIENTE, tras ./actualizar.sh. Se guarda en Alumnos/DIW/P4-avance-X.json y la nota final la usa.

  Nota de cada bloque (sobre 10): comprobaciones del bloque 5 p (sin las 👀) + AVANCE en su fecha 2,5 p
    + Stylelint 0,5 p + Prettier 0,5 p + rama feature/p4-X fusionada en develop y, con develop, en main 1,5 p
    (Stylelint, Prettier y la rama solo suman con al menos la mitad del bloque en verde).
    ENTREGA = media de A, B, C y D (30 % de la práctica; el 70 % es la defensa, y hay que aprobarla).

  Uso (todo en Docker: revisar.sh lanza este script dentro de un contenedor):
        bash revisar.sh --avance a                         → la foto del 12/01 (la mañana del 13/01)
        bash revisar.sh --hasta "2027-02-01 23:59"         → la entrega, con los avances
        bash revisar.sh --parte b ana luis                 → solo ese bloque y esos alumnos
        bash revisar.sh --repos /otra/carpeta              → otros repos (el informe va al lado)
        bash revisar.sh --progreso                         → avance semana a semana para el planificador

Escribe Alumnos/DIW/P4.md (o P4-bloque-X.md con --parte) y la entrega para la app de defensas
(docs/defensa/practicas/diw-p4-entregas.json). No toca los repos.
"""
import argparse, io, json, os, shutil, subprocess, sys, tarfile
from pathlib import Path

AQUI = Path(__file__).resolve().parent
REPOS = AQUI.parents[1] / "Alumnos/DIW/repos"
RUNNER = AQUI / ".runner"
PLANTILLA = AQUI / "plantilla"
IMAGEN = "node:22-alpine"
MARCA = "src/datos/huecos.js"   # el fichero que identifica su proyecto

# Cada bloque: la rama en la que se trabaja (se mira que esté fusionada en develop y en main)
BLOQUES = {"A": "feature/p4-a", "B": "feature/p4-b", "C": "feature/p4-c", "D": "feature/p4-d"}
# Fechas de avance (al acabar cada unidad). Lo subido de ese bloque hasta esa hora puntúa.
HITOS = {"A": "2027-01-12 23:59", "B": "2027-01-19 23:59", "C": "2027-01-26 23:59", "D": "2027-01-28 23:59"}
ENTREGA = "2027-02-01 23:59"
PESOS = {"comprobador": 5, "avance": 2.5, "stylelint": 0.5, "prettier": 0.5, "rama": 1.5}   # 31/10: más proceso, menos resultado
# Lo que se copia de su proyecto; lo demás (comprobador, datos de la prueba, configuración) es nuestro
SUYO = ["index.html", "cita.html", "mi-cita.html", "accesibilidad.html", "scss", "src", "public", "revision.md", "informe.md",
        "declaracion.md", "evaluacion.md", "verificacion.md"]
NUESTRO = ["comprobador", "package.json", "package-lock.json", ".stylelintrc.json", ".prettierrc.json", "vite.config.mjs",
           "sesiones.md"]
ALUMNOS_TSV = AQUI.parents[1] / "Alumnos/DIW/alumnos.tsv"
ENTREGAS_APP = AQUI.parent / "docs/defensa/practicas/diw-p4-entregas.json"


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


def ramas_de(repo):
    return git(repo, "for-each-ref", "--format=%(refname:short)", "refs/heads").split()


def elegir_ref(repo, rama, hasta):
    # La entrega es main; en los avances, su feature/p4-X o, si no existe, lo que ya haya fusionado en develop
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
    """Deja .runner/ con NUESTRO proyecto base (sin nada suyo)."""
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


def revisar(repo, bloques, rama, hasta, foto=False):
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
        fila["obs"].append("no hay proyecto de la P4")
        return fila
    marcas.sort(key=lambda f: ("p4-cita-facil/" not in f, len(f)))   # mejor la de p4-cita-facil/
    base = marcas[0][: -len(MARCA)]

    suyo = git(repo, "show", f"{commit}:{base}comprobador/comprobar.mjs", binario=True)
    if suyo and suyo.replace(b"\r\n", b"\n") != (PLANTILLA / "comprobador/comprobar.mjs").read_bytes():
        fila["obs"].append("⚠️ ha cambiado el comprobador")

    limpiar_runner()
    extraer(repo, commit, base, SUYO, RUNNER)
    # los datos (huecos y citas) son nuestros: si los ha cambiado, se avisa y se ponen los del kit
    for DATOS in ("src/datos/huecos.js", "src/datos/citas.js"):
        nuestros = (PLANTILLA / DATOS).read_bytes()
        suyos = RUNNER / DATOS
        if suyos.exists() and suyos.read_bytes().replace(b"\r\n", b"\n") != nuestros:
            fila["obs"].append(f"⚠️ ha cambiado {DATOS} (se corrige con los del kit)")
        suyos.parent.mkdir(parents=True, exist_ok=True)
        suyos.write_bytes(nuestros)
    args = ["node", "comprobador/comprobar.mjs", "--json"]
    try:
        r = docker(*args, timeout=300)
    except subprocess.TimeoutExpired:
        fila["obs"].append("💥 tiempo agotado")
        return fila
    try:
        datos = json.loads(r.stdout)
    except json.JSONDecodeError:
        fila["obs"].append("💥 el comprobador no ha podido ejecutarse: " + r.stderr.decode()[-120:].strip())
        return fila
    for x in datos["resultados"]:
        if not x["cuenta"] or x["bloque"] not in bloques:
            continue
        ap = x["id"].split(".")[0]                         # A1.2 → A1
        g = f"{x['bloque']}/{ap}"
        ok, total = fila["grupos"].get(g, (0, 0))
        fila["grupos"][g] = (ok + x["ok"], total + 1)
        if not x["ok"]:
            fila["rojos"].append(f"{x['id']} · {x['texto']}")

    if not foto:
        fila["stylelint"] = docker("npx", "stylelint", "scss/**/*.scss", timeout=120).returncode == 0
        fila["prettier"] = docker("npx", "prettier", "--check", "src/**/*.js", "scss/**/*.scss", "*.html",
                                  timeout=120).returncode == 0
        ramas = ramas_de(repo)
        contenida = lambda rama, en: subprocess.run(
            ["git", "-C", str(repo), "merge-base", "--is-ancestor", rama, en]).returncode == 0
        fila["fusionadas"] = {
            b: BLOQUES[b] in ramas and "develop" in ramas
               and contenida(BLOQUES[b], "develop") and contenida(BLOQUES[b], commit)
            for b in bloques}
    return fila


# ------------------------------------------------------------------------------ notas e informe
coma = lambda x: f"{x:.1f}".replace(".", ",")
celda = lambda f, g: f"{f['grupos'][g][0]}/{f['grupos'][g][1]}" if g in f["grupos"] else "—"


def verdes(f, bloque):
    """(verdes, total) de las comprobaciones de ese bloque (sin las 👀)."""
    gs = [g for g in f["grupos"] if g.startswith(bloque + "/")]
    return sum(f["grupos"][g][0] for g in gs), sum(f["grupos"][g][1] for g in gs)


def ruta_avance(repos, bloque):
    return repos.parent / f"P4-avance-{bloque.lower()}.json"


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


def informe(filas, bloques, a):
    sin_foto = [b for b in bloques if not ruta_avance(a.repos, b).exists()]
    lineas = ["# DIW P4 · Cita Fácil — corrección automática de la entrega", "",
              f"Rama: `{a.rama}`" + (f" · commits hasta {a.hasta}" if a.hasta else ""), "",
              "Nota de cada bloque = comprobaciones del bloque 5 p + avance en su fecha 2,5 p + Stylelint 0,5 p"
              " + Prettier 0,5 p + rama `feature/p4-X` fusionada en `develop` y en `main` 1,5 p (estos tres, solo con la mitad"
              " del bloque en verde). **Entrega** = media de"
              " los bloques (30 % de la práctica; la defensa, el 70 %, va aparte, y hay que aprobarla).", ""]
    if sin_foto:
        lineas += [f"⚠️ Sin foto de avance de: {', '.join(sin_foto)} (`--avance`): ese avance cuenta 0.", ""]
    lineas += ["| Alumno | Commit | " + " | ".join(f"{b}: compr. · avance · rama · **nota**" for b in bloques)
               + " | Stylelint | Prettier | **Entrega** | Observaciones |",
               "|---|---|" + ":-:|" * (len(bloques) + 3) + "---|"]
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
                      f" | **{coma(f['media'])}** | {'; '.join(f['obs'])} |")
    detalle = sorted({g for f in filas for g in f["grupos"]})
    lineas += ["", "## Detalle por apartado", "",
               "| Alumno | " + " | ".join(detalle) + " |", "|---|" + ":-:|" * len(detalle)]
    for f in filas:
        lineas.append(f"| {f['alumno']} | " + " | ".join(celda(f, g) for g in detalle) + " |")
    lineas += ["", "## Lo que tiene en rojo (para preparar la defensa)", ""]
    for f in filas:
        if f["rojos"]:
            lineas += [f"**{f['alumno']}**", ""] + [f"- {r}" for r in f["rojos"]] + [""]
    nombre = "P4.md" if len(bloques) == len(BLOQUES) else f"P4-bloque-{bloques[0].lower()}.md"
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
    ap.add_argument("--parte", choices=["a", "b", "c", "d", "todo"], default="todo", help="un bloque o todos (por defecto)")
    ap.add_argument("--rama", default="main", help="la rama que se corrige (por defecto main)")
    ap.add_argument("--repos", type=Path, default=REPOS, help="carpeta con los repos (por defecto Alumnos/DIW/repos)")
    ap.add_argument("--hasta", help='p. ej. "2027-02-01 23:59": último commit antes de esa hora')
    ap.add_argument("--avance", choices=["a", "b", "c", "d"], help="hace la FOTO de la fecha de avance de ese bloque")
    ap.add_argument("--progreso", action="store_true", help="avance semana a semana (pestaña Repositorios del planificador)")
    ap.add_argument("--desde", default="2027-01-07", help="con --progreso: desde qué día")
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
        return progreso.ejecutar("diw-p4", repos, comprobar, a.repos.parent / "P4-progreso.json", a.desde,
                                 ENTREGA[:10], progreso.firma(PLANTILLA / "comprobador"), HITOS)
    filas = []
    for repo in repos:
        f = revisar(repo, bloques, a.rama, a.hasta)
        filas.append(f)
        g = " ".join(f"{k}:{v[0]}/{v[1]}" for k, v in sorted(f["grupos"].items()))
        print(f"{f['alumno']:18} {f['rama']:10} {f['commit']:8} {g:70} {'; '.join(f['obs'])}")
    informe(filas, bloques, a)


if __name__ == "__main__":
    sys.exit(main())
