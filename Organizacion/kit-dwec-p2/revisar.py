#!/usr/bin/env python3
"""
revisar.py — (DOCENTE) corrige la ENTREGA de la P2 de DWEC pasando NUESTROS tests al código de cada alumno.

Para cada alumno de GestionDocente/Alumnos/DWEC/repos (haz antes ./actualizar.sh):
  1. Elige el commit: el último de main (o master), o el último ANTES de --hasta (la entrega es una
     sola, el día anterior a la defensa: --hasta "AAAA-MM-DD 23:59").
  2. Encuentra su proyecto (la carpeta que tiene src/modelo/Tarea.js, esté donde esté) y copia su src/
     y su public/ a un proyecto limpio (.runner/) con NUESTRO index.html y NUESTROS tests (plantilla/),
     así da igual si ha tocado los tests o la estructura de la página. Avisa si ha cambiado algún test.
     (Desde el 26/10 no escriben tests propios: solo cuentan los nuestros.)
  3. Ejecuta Vitest, ESLint y Prettier EN DOCKER (node:22-alpine; nada instalado en el ordenador).

  AVANCES (parte de la rúbrica): en cada fecha de avance (HITOS, abajo) se hace una FOTO de lo que hay
  subido del bloque de esa fecha: su rama feature/p2-X (o develop, o main), último commit antes de la fecha, solo
  nuestros tests de ese bloque. Hazla LA MAÑANA SIGUIENTE, tras ./actualizar.sh: lo que no estuviera
  subido entonces no cuenta, aunque luego aparezca con una fecha anterior (las fechas de git se pueden
  falsear; la foto no). Se guarda en Alumnos/DWEC/P2-avance-X.json y la nota final la usa.

  Nota de cada bloque (sobre 10): nuestros tests 5 p (sin los del ejemplo resuelto, «👀 …»)
    + AVANCE en su fecha 2,5 p (verdes del bloque en la foto ÷ total)
    + ESLint sin errores 0,5 p + Prettier 0,5 p + rama feature/p2-X fusionada en develop y, con develop, en main 1,5 p.
    (Trabajan en develop: cada feature/p2-X sale de develop y vuelve a develop; al final, develop → main.)
    Nota de la ENTREGA = media de A, B y C (30 % de la práctica; el 70 % es la defensa).

  Uso (todo en Docker: revisar.sh lanza este script dentro de un contenedor):
        bash revisar.sh --avance a                         → la foto del 06/11 (la mañana del 07/11)
        bash revisar.sh --hasta "2026-11-25 23:59"         → la entrega, con los avances
        bash revisar.sh --parte bloque-a a1 a2                → solo ese bloque y esos alumnos
        bash revisar.sh --repos /otra/carpeta              → otros repos (el informe va al lado)
        bash revisar.sh --progreso --desde 2026-10-16      → avance semana a semana para el planificador
                                                             (Alumnos/DWEC/P2-progreso.json; ../tools/progreso.py)

Escribe Alumnos/DWEC/P2.md (o P2-bloque-X.md con --parte) y la entrega para la app de defensas
(docs/defensa/practicas/dwec-p2-entregas.json). No toca los repos.
"""
import argparse, io, json, os, shutil, subprocess, sys, tarfile
from pathlib import Path

AQUI = Path(__file__).resolve().parent
REPOS = AQUI.parents[1] / "Alumnos/DWEC/repos"
RUNNER = AQUI / ".runner"
PLANTILLA = AQUI / "plantilla"
TESTS = PLANTILLA / "tests"
IMAGEN = "node:22-alpine"

# Cada bloque: su carpeta de tests y la rama en la que se trabaja (se mira que esté fusionada en develop y en main)
BLOQUES = {
    "bloque-a": "feature/p2-a",
    "bloque-b": "feature/p2-b",
    "bloque-c": "feature/p2-c",
}
# Fechas de avance (las de clase: al acabar cada unidad). Lo subido de ese bloque hasta esa hora puntúa.
HITOS = {
    "bloque-a": "2026-11-06 23:59",
    "bloque-b": "2026-11-20 23:59",
    "bloque-c": "2026-11-25 23:59",
}
PESOS = {"tests": 5, "avance": 2.5, "eslint": 0.5, "prettier": 0.5, "rama": 1.5}   # 31/10: más proceso, menos resultado
ALUMNOS_TSV = AQUI.parents[1] / "Alumnos/DWEC/alumnos.tsv"
ENTREGAS_APP = AQUI.parent / "docs/defensa/practicas/dwec-p2-entregas.json"


def git(repo, *args, binario=False):
    r = subprocess.run(["git", "-C", str(repo), *args], capture_output=True)
    return r.stdout if binario else r.stdout.decode(errors="replace").strip()


def docker(*orden, timeout=None):
    """Ejecuta una orden en node:22-alpine con .runner montado en /app y nuestros permisos."""
    return subprocess.run(["docker", "run", "--rm", "-u", f"{os.getuid()}:{os.getgid()}", "-e", "TZ=Europe/Madrid",
                           "-e", "npm_config_cache=/tmp/npm", "-v", f"{RUNNER}:/app", "-w", "/app", IMAGEN, *orden],
                          capture_output=True, timeout=timeout)


def preparar_runner():
    """node_modules con las dependencias de la plantilla (se rehace si cambia el package-lock)."""
    lock = (PLANTILLA / "package-lock.json").read_bytes()
    if (RUNNER / "node_modules").exists() and (RUNNER / "package-lock.json").exists() \
            and (RUNNER / "package-lock.json").read_bytes() == lock:
        return
    RUNNER.mkdir(exist_ok=True)
    for f in ("package.json", "package-lock.json"):
        shutil.copy(PLANTILLA / f, RUNNER / f)
    print("Instalando dependencias en .runner/ con Docker (solo cuando cambian)…")
    r = docker("npm", "ci", "--no-audit", "--no-fund")
    if r.returncode:
        sys.exit("No se ha podido preparar .runner/: " + r.stderr.decode()[-400:])


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


def grupo(carpeta, fichero, describe):
    """A qué grupo cuenta un test. Los del ejemplo resuelto (describe «👀 …») no cuentan."""
    if describe.startswith("👀"):
        return None
    return f"{carpeta}/{fichero.split('.')[0]}"


def revisar(repo, bloques, rama, hasta, foto=False):
    """foto=True: solo nuestros tests (sin ESLint ni ramas), para las fotos de avance."""
    ref, commit = elegir_ref(repo, rama, hasta)
    fila = {"alumno": repo.name, "rama": ref or "—", "commit": (commit or "")[:7], "grupos": {}, "obs": [], "rojos": []}
    if not commit:
        fila["obs"].append("sin rama/commit")
        return fila
    if ref != rama:
        fila["obs"].append(f"no hay {rama}: uso {ref}")
    tareas = [f for f in git(repo, "ls-tree", "-r", "--name-only", commit).splitlines()
              if f.endswith("src/modelo/Tarea.js") and "node_modules" not in f]
    if not tareas:
        fila["obs"].append("no hay src/modelo/Tarea.js")
        return fila
    base = tareas[0][: -len("src/modelo/Tarea.js")]

    # ¿Ha tocado nuestros tests?
    for c in bloques:
        for t in sorted((TESTS / c).glob("*.js")):
            suyo = git(repo, "show", f"{commit}:{base}tests/{c}/{t.name}", binario=True)
            if suyo and suyo.replace(b"\r\n", b"\n") != t.read_bytes():
                fila["obs"].append(f"⚠️ ha cambiado tests/{c}/{t.name}")

    # Proyecto limpio: su src/ y public/ + nuestro index.html y nuestros tests
    for d in ("src", "tests", "public"):
        shutil.rmtree(RUNNER / d, ignore_errors=True)
    shutil.copy(PLANTILLA / "index.html", RUNNER / "index.html")
    (RUNNER / "tests").mkdir()
    for f in TESTS.glob("*.js"):  # ayudas comunes (pagina.js, simulados.js)
        shutil.copy(f, RUNNER / "tests" / f.name)
    for c in bloques:
        shutil.copytree(TESTS / c, RUNNER / "tests" / c)
    extraer(repo, commit, base, ["src", "public"], RUNNER)

    salida = RUNNER / "resultado.json"
    salida.unlink(missing_ok=True)
    try:
        docker("npx", "vitest", "run", "--reporter=json", "--outputFile=resultado.json", timeout=240)
    except subprocess.TimeoutExpired:
        fila["obs"].append("💥 tiempo agotado (¿bucle infinito?)")
        return fila
    if not salida.exists():
        fila["obs"].append("💥 Vitest no ha podido ejecutarse")
        return fila
    for fichero in json.loads(salida.read_text())["testResults"]:
        ruta = Path(fichero["name"])
        carpeta, nombre = ruta.parent.name, ruta.name
        if not fichero["assertionResults"] and fichero.get("message"):
            fila["obs"].append(f"💥 {carpeta}/{nombre}: {fichero['message'].splitlines()[0][:90]}")
        for t in fichero["assertionResults"]:
            if t["status"] == "todo":
                continue
            g = grupo(carpeta, nombre, (t["ancestorTitles"] or [""])[0])
            if g is None:
                continue
            ok, total = fila["grupos"].get(g, (0, 0))
            fila["grupos"][g] = (ok + (t["status"] == "passed"), total + 1)
            if t["status"] != "passed":
                fila["rojos"].append(f"{g.split('/')[0][-1].upper()} · {t['title']}")

    if not foto:
        calidad(repo, commit, base, bloques, fila)
    return fila


def calidad(repo, commit, base, bloques, fila):
    """ESLint y Prettier (nuestra configuración) sobre su src/ y tests/, y si las ramas están fusionadas."""
    for d in ("src", "tests"):
        shutil.rmtree(RUNNER / d, ignore_errors=True)
    extraer(repo, commit, base, ["src", "tests"], RUNNER)
    for f in ("eslint.config.js", ".prettierrc"):
        shutil.copy(PLANTILLA / f, RUNNER / f)
    r = docker("npx", "eslint", "--format", "json", "src", "tests", timeout=120)
    try:
        fila["eslint"] = sum(x["errorCount"] for x in json.loads(r.stdout or b"[]"))
    except json.JSONDecodeError:
        fila["eslint"] = -1
    fila["prettier"] = docker("npx", "prettier", "--check", "src", "tests", timeout=120).returncode == 0
    # Fusionada = la feature/p2-X está en develop y en el commit de main que se corrige (develop → main)
    ramas = ramas_de(repo)
    contenida = lambda rama, en: subprocess.run(
        ["git", "-C", str(repo), "merge-base", "--is-ancestor", rama, en]).returncode == 0
    fila["fusionadas"] = {
        b: BLOQUES[b] in ramas and "develop" in ramas
           and contenida(BLOQUES[b], "develop") and contenida(BLOQUES[b], commit)
        for b in bloques}


# ------------------------------------------------------------------------------ notas e informe
coma = lambda x: f"{x:.1f}".replace(".", ",")
celda = lambda f, g: f"{f['grupos'][g][0]}/{f['grupos'][g][1]}" if g in f["grupos"] else "—"


def nuestros(f, bloque):
    """(verdes, total) de nuestros tests de ese bloque (sin los del ejemplo)."""
    gs = [g for g in f["grupos"] if g.startswith(bloque + "/")]
    return sum(f["grupos"][g][0] for g in gs), sum(f["grupos"][g][1] for g in gs)


def ruta_avance(repos, bloque):
    return repos.parent / f"P2-avance-{bloque[-1]}.json"


def avance(repos, bloque, alumno):
    """Fracción (0–1) del bloque en verde en su fecha, según la foto; None si no hay foto."""
    ruta = ruta_avance(repos, bloque)
    if not ruta.exists():
        return None
    d = json.loads(ruta.read_text()).get("alumnos", {}).get(alumno)
    return d["ok"] / d["total"] if d and d.get("total") else 0.0


def nota_bloque(f, bloque, av):
    ok, total = nuestros(f, bloque)
    if not total:
        return None
    return (PESOS["tests"] * ok / total + PESOS["avance"] * (av or 0)
            + PESOS["eslint"] * (f.get("eslint") == 0) + PESOS["prettier"] * f.get("prettier", False)
            + PESOS["rama"] * f.get("fusionadas", {}).get(bloque, False))


def informe(filas, bloques, a):
    letra = lambda b: b[-1].upper()
    sin_foto = [b for b in bloques if not ruta_avance(a.repos, b).exists()]
    lineas = ["# DWEC P2 · Tablero de tareas — corrección automática de la entrega", "",
              f"Rama: `{a.rama}`" + (f" · commits hasta {a.hasta}" if a.hasta else ""), "",
              "Nota de cada bloque = nuestros tests 5 p + avance en su fecha 2,5 p + ESLint 0,5 p"
              " + Prettier 0,5 p + rama `feature/p2-X` fusionada en `develop` y en `main` 1,5 p. **Entrega** = media de los bloques (30 % de la"
              " práctica; la defensa, el 70 %, va aparte).", ""]
    if sin_foto:
        lineas += [f"⚠️ Sin foto de avance de: {', '.join(letra(b) for b in sin_foto)} (`--avance`): ese avance cuenta 0.", ""]
    lineas += ["| Alumno | Commit | " + " | ".join(f"{letra(b)}: tests · avance · rama · **nota**" for b in bloques)
               + " | ESLint | Prettier | **Entrega** | Observaciones |",
               "|---|---|" + ":-:|" * (len(bloques) + 3) + "---|"]
    for f in filas:
        celdas, notas = [], []
        for b in bloques:
            ok, total = nuestros(f, b)
            av = avance(a.repos, b, f["alumno"])
            n = nota_bloque(f, b, av)
            f.setdefault("notas", {})[b] = n
            notas.append(n or 0)
            celdas.append(f"{ok}/{total} · {'—' if av is None else f'{round(100 * av)} %'}"
                          f" · {'✓' if f.get('fusionadas', {}).get(b) else '✗'} · **{coma(n) if n is not None else '—'}**")
        eslint = {None: "—", 0: "✓", -1: "💥"}.get(f.get("eslint"), f"{f.get('eslint')} err.")
        f["media"] = sum(notas) / len(notas)
        lineas.append(f"| {f['alumno']} | {f['commit']} | " + " | ".join(celdas)
                      + f" | {eslint} | {'✓' if f.get('prettier') else '✗'} | **{coma(f['media'])}** | {'; '.join(f['obs'])} |")
    detalle = sorted({g for f in filas for g in f["grupos"]})
    lineas += ["", "## Detalle por fichero de tests", "",
               "| Alumno | " + " | ".join(detalle) + " |", "|---|" + ":-:|" * len(detalle)]
    for f in filas:
        lineas.append(f"| {f['alumno']} | " + " | ".join(celda(f, g) for g in detalle) + " |")
    nombre = "P2.md" if len(bloques) == len(BLOQUES) else f"P2-{bloques[0]}.md"
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
        verdes = sum(nuestros(f, b)[0] for b in BLOQUES)
        datos[nombres.get(f["alumno"], f["alumno"])] = {
            "verdes": verdes, "nota": round(f["media"], 2), "fallos": f["rojos"][:40],
            "avisos": f["obs"] + [f"{b[-1].upper()}: {coma(n)}" for b, n in f["notas"].items() if n is not None]}
    ENTREGAS_APP.write_text(json.dumps(datos, ensure_ascii=False, indent=1) + "\n")
    print(f"→ {ENTREGAS_APP} (para la app de defensas; se sube con publicar.sh y tu orden)")


def foto_avance(repos, bloque, alumnos):
    """La foto de una fecha de avance: nuestros tests del bloque en su rama, hasta la fecha."""
    filas = {}
    for repo in repos:
        f = revisar(repo, [bloque], BLOQUES[bloque], HITOS[bloque], foto=True)
        ok, total = nuestros(f, bloque)
        filas[repo.name] = {"rama": f["rama"], "commit": f["commit"], "ok": ok,
                            "total": total, "obs": f["obs"]}
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
    ap.add_argument("--parte", choices=[*BLOQUES, "todo"], default="todo", help="un bloque o todos (por defecto)")
    ap.add_argument("--rama", default="main", help="la rama que se corrige (por defecto main)")
    ap.add_argument("--repos", type=Path, default=REPOS, help="carpeta con los repos (por defecto Alumnos/DWEC/repos)")
    ap.add_argument("--hasta", help='p. ej. "2026-11-25 23:59": último commit antes de esa hora')
    ap.add_argument("--avance", choices=["a", "b", "c"], help="hace la FOTO de la fecha de avance de ese bloque")
    ap.add_argument("--progreso", action="store_true", help="avance semana a semana (pestaña Repositorios del planificador)")
    ap.add_argument("--desde", default="2026-10-16", help="con --progreso: desde qué día")
    a = ap.parse_args()
    bloques = list(BLOQUES) if a.parte == "todo" else [a.parte]
    preparar_runner()
    repos = sorted(p for p in a.repos.iterdir() if (p / ".git").exists())
    if a.alumnos:
        repos = [p for p in repos if p.name in a.alumnos]
    if a.avance:
        return foto_avance(repos, f"bloque-{a.avance}", a.alumnos)
    if a.progreso:
        sys.path.insert(0, str(AQUI.parent / "tools"))
        import progreso

        def comprobar(repo, rama, hasta):
            f = revisar(repo, list(BLOQUES), rama, hasta, foto=True)
            return f["rama"], f["commit"], f["grupos"], f["obs"]
        return progreso.ejecutar("dwec-p2", repos, comprobar, a.repos.parent / "P2-progreso.json", a.desde,
                                 HITOS["bloque-c"][:10], progreso.firma(TESTS),
                                 {b[-1].upper(): h for b, h in HITOS.items()})
    filas = []
    for repo in repos:
        f = revisar(repo, bloques, a.rama, a.hasta)
        filas.append(f)
        g = " ".join(f"{k.split('/')[-1]}:{v[0]}/{v[1]}" for k, v in sorted(f["grupos"].items()))
        print(f"{f['alumno']:18} {f['rama']:20} {f['commit']:8} {g:60} {'; '.join(f['obs'])}")
    informe(filas, bloques, a)


if __name__ == "__main__":
    sys.exit(main())
