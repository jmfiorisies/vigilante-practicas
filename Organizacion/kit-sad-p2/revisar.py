#!/usr/bin/env python3
"""
revisar.py — (DOCENTE) el AVANCE COMPROBADO de la P2 de SAD para la pestaña 🐙 Repositorios del planificador.

  bash revisar.sh --progreso                 → Alumnos/SAD/P2-progreso.json (../tools/progreso.py)
  bash revisar.sh --progreso a1 a2           → solo esos alumnos

Para cada commit que haya que mirar (cada domingo y «ahora», solo los nuevos: hay caché por commit):
  1. Encuentra en su repositorio la carpeta del kit (la que tiene fw/nftables.conf) y la saca de ese commit.
  2. La carga en un laboratorio aparte (.runner/sad-p2, copia limpia del kit, sin solucion/) con
     «./lab.sh cargar CARPETA» —la misma orden que usa el profesor— y pasa «./lab.sh comprobar».
  3. Apunta cada prueba ✔/✘ por apartado (A1, B2…; los 👀 no cuentan).
Al acabar para el laboratorio. Las máquinas se llaman igual que las del kit (sad-p2-*): si tienes tu laboratorio
arrancado, para antes (./lab.sh parar). Las claves de WireGuard no van al repositorio (.gitignore): lo que
dependa de ellas sale como lo deje «./lab.sh cargar».
No toca los repos.
"""
import argparse, io, re, shutil, subprocess, sys, tarfile, tempfile
from pathlib import Path

AQUI = Path(__file__).resolve().parent
REPOS = AQUI.parents[1] / "Alumnos/SAD/repos"
RUNNER = AQUI / ".runner" / "sad-p2"
ANCLA = "fw/nftables.conf"
FUERA = {"solucion", "copias", "entrega", ".runner", ".alumno", "revisar.py", "revisar.sh", "__pycache__"}
# Fechas de avance de cada bloque (las del calendario: A y B el 13/11, C y D el 1/12)
HITOS = {"A": "2026-11-13 23:59", "B": "2026-11-13 23:59", "C": "2026-12-01 23:59", "D": "2026-12-01 23:59"}
LINEA = re.compile(r"^(✔|✘)\s+(👀\s*)?([A-D])(\d+)\w*\s+·")


def git(repo, *args, binario=False):
    r = subprocess.run(["git", "-C", str(repo), *args], capture_output=True)
    return r.stdout if binario else r.stdout.decode(errors="replace").strip()


def lab(*orden, timeout=900):
    return subprocess.run(["bash", "lab.sh", *orden], cwd=RUNNER, capture_output=True, text=True, timeout=timeout)


def preparar_runner():
    """Copia limpia del kit, sin la solución; el laboratorio de siempre (sad-p2-*) no puede estar en marcha."""
    viva = subprocess.run(["docker", "inspect", "-f", "{{.State.Running}} {{index .Config.Labels \"com.docker.compose.project.working_dir\"}}",
                           "sad-p2-fw"], capture_output=True, text=True)
    corre, _, donde = viva.stdout.strip().partition(" ")
    if viva.returncode == 0 and Path(donde) != RUNNER:
        if corre == "true":
            sys.exit(f"✘ Hay un laboratorio de la P2 de SAD arrancado en {donde}: páralo (./lab.sh parar) y repite.")
        # parado: se quitan sus contenedores (tus ficheros siguen en su carpeta; ./lab.sh arrancar los vuelve a crear)
        ids = subprocess.run(["docker", "ps", "-aq", "--filter", "name=sad-p2-"], capture_output=True, text=True).stdout.split()
        subprocess.run(["docker", "rm", *ids], capture_output=True)
        print(f"(quitados los contenedores parados del laboratorio de {donde})")
    shutil.rmtree(RUNNER, ignore_errors=True)
    shutil.copytree(AQUI, RUNNER, ignore=lambda d, fs: [f for f in fs if Path(d) == AQUI and f in FUERA])


def comprobar(repo, rama, hasta):
    """(rama, commit, {apartado: (verdes, total)}, obs) de lo que había en esa rama a esa hora."""
    c = git(repo, "rev-list", "-1", f"--before={hasta}", rama) if hasta else git(repo, "rev-parse", rama)
    if not c:
        return rama, None, {}, ["sin commits antes de la fecha"]
    anclas = [f for f in git(repo, "ls-tree", "-r", "--name-only", c).splitlines() if f.endswith(ANCLA)]
    if not anclas:
        return rama, c, {}, ["sin la carpeta del kit (fw/nftables.conf)"]
    base = anclas[0][: -len(ANCLA)]
    obs, grupos = [], {}
    with tempfile.TemporaryDirectory(dir=AQUI / ".runner") as t:
        tar = git(repo, "archive", c, "--", base or ".", binario=True)
        with tarfile.open(fileobj=io.BytesIO(tar)) as tf:
            for m in tf.getmembers():
                if m.isfile() and m.name.startswith(base):
                    f = Path(t) / m.name[len(base):]
                    f.parent.mkdir(parents=True, exist_ok=True)
                    f.write_bytes(tf.extractfile(m).read())
        try:
            if "parada" in lab("estado").stdout:              # la primera vez, arrancar (cargar lo necesita)
                lab("arrancar")
            r = lab("cargar", t)
            if r.returncode:
                obs.append("💥 no carga: " + (r.stdout + r.stderr).strip().splitlines()[-1][:90])
                return rama, c, {}, obs
            lab("aplicar")
            r = lab("comprobar")
        except subprocess.TimeoutExpired:
            return rama, c, {}, ["💥 tiempo agotado"]
    for l in r.stdout.splitlines():
        m = LINEA.match(re.sub(r"\x1b\[[0-9;]*m", "", l))
        if not m or m.group(2):
            continue
        k = m.group(3) + m.group(4)
        ok, total = grupos.get(k, (0, 0))
        grupos[k] = (ok + (m.group(1) == "✔"), total + 1)
    if not grupos:
        obs.append("el comprobador no ha dado resultados")
    return rama, c, grupos, obs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("alumnos", nargs="*")
    ap.add_argument("--repos", type=Path, default=REPOS)
    ap.add_argument("--progreso", action="store_true", help="avance semana a semana (pestaña Repositorios del planificador)")
    ap.add_argument("--desde", default="2026-10-26", help="con --progreso: desde qué día")
    a = ap.parse_args()
    if not a.progreso:
        sys.exit("De momento solo: --progreso (la corrección de la entrega se hace con ./lab.sh cargar)")
    repos = sorted(p for p in a.repos.resolve().iterdir() if (p / ".git").exists())
    if a.alumnos:
        repos = [p for p in repos if p.name in a.alumnos]
    sys.path.insert(0, str(AQUI.parent / "tools"))
    import progreso
    (AQUI / ".runner").mkdir(exist_ok=True)
    preparado = False

    def comprobar_perezoso(repo, rama, hasta):        # solo se monta el laboratorio si hay algo que comprobar
        nonlocal preparado
        c = git(repo, "rev-list", "-1", f"--before={hasta}", rama) if hasta else git(repo, "rev-parse", rama)
        if c and not preparado and any(f.endswith(ANCLA) for f in git(repo, "ls-tree", "-r", "--name-only", c).splitlines()):
            preparar_runner()
            preparado = True
        return comprobar(repo, rama, hasta)
    try:
        firma = progreso.firma(AQUI / "lab.sh")
        progreso.ejecutar("sad-p2", repos, comprobar_perezoso, a.repos.resolve().parent / "P2-progreso.json",
                          a.desde, "2026-12-01", firma, HITOS)
    finally:
        if preparado:
            lab("parar", timeout=300)


if __name__ == "__main__":
    sys.exit(main())
