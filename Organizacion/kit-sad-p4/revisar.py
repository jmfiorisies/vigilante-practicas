#!/usr/bin/env python3
"""
revisar.py — (DOCENTE) el AVANCE COMPROBADO de la P4 de SAD (Clínica dental Sonríe) para la pestaña 🐙 Repositorios del planificador.

  bash revisar.sh --progreso                 → Alumnos/SAD/P4-progreso.json (../tools/progreso.py)
  bash revisar.sh --progreso a1 a2           → solo esos alumnos

Para cada commit que haya que mirar (cada domingo y «ahora», solo los nuevos: hay caché por commit):
  1. Encuentra en su repositorio la carpeta del kit (la que tiene informe/hallazgos.md) y la saca de ese commit.
  2. La carga en un laboratorio aparte (.runner/sad-p4, copia limpia del kit, sin solucion/) con
     «./lab.sh cargar CARPETA» —la misma orden que usa el profesor—, que ya comprueba.
  3. Apunta cada prueba ✔/✘ por apartado (A1, B2…; los 👀 no cuentan).
El bloque B se comprueba contra SU ataque (cargar calcula la verdad con las copias de los registros que ha subido);
la contención (B7) sale de su entrega/informe.txt. Al acabar para el laboratorio. Las máquinas se llaman igual que
las del kit (sad-p4-*): si tienes tu laboratorio arrancado, para antes (./lab.sh parar).
No toca los repos.
"""
import argparse, io, re, shutil, subprocess, sys, tarfile, tempfile
from pathlib import Path

AQUI = Path(__file__).resolve().parent
REPOS = AQUI.parents[1] / "Alumnos/SAD/repos"
RUNNER = AQUI / ".runner" / "sad-p4"
ANCLA = "informe/hallazgos.md"
FUERA = {"solucion", "copias", "entrega", ".runner", ".alumno", "revisar.py", "revisar.sh", "__pycache__"}
# Fechas de cada bloque (las del calendario): avance de A al acabar la UD7 (mié 9/12) y entrega de los dos el lun 14/12
HITOS = {"A": "2026-12-09 23:59", "B": "2026-12-14 23:59"}
LINEA = re.compile(r"^(✔|✘)\s+(👀\s*)?([AB])(\d+)\w*\s+·")


def git(repo, *args, binario=False):
    r = subprocess.run(["git", "-C", str(repo), *args], capture_output=True)
    return r.stdout if binario else r.stdout.decode(errors="replace").strip()


def lab(*orden, timeout=900):
    return subprocess.run(["bash", "lab.sh", *orden], cwd=RUNNER, capture_output=True, text=True, timeout=timeout)


def preparar_runner():
    """Copia limpia del kit, sin la solución; el laboratorio de siempre (sad-p4-*) no puede estar en marcha."""
    viva = subprocess.run(["docker", "inspect", "-f", "{{.State.Running}} {{index .Config.Labels \"com.docker.compose.project.working_dir\"}}",
                           "sad-p4-web"], capture_output=True, text=True)
    corre, _, donde = viva.stdout.strip().partition(" ")
    if viva.returncode == 0 and Path(donde) != RUNNER:
        if corre == "true":
            sys.exit(f"✘ Hay un laboratorio de la P4 de SAD arrancado en {donde}: páralo (./lab.sh parar) y repite.")
        # parado: se quitan sus contenedores (tus ficheros siguen en su carpeta; ./lab.sh arrancar los vuelve a crear)
        ids = subprocess.run(["docker", "ps", "-aq", "--filter", "name=sad-p4-"], capture_output=True, text=True).stdout.split()
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
        return rama, c, {}, ["sin la carpeta del kit (informe/hallazgos.md)"]
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
    ap.add_argument("--desde", default="2026-12-02", help="con --progreso: desde qué día")
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
        progreso.ejecutar("sad-p4", repos, comprobar_perezoso, a.repos.resolve().parent / "P4-progreso.json",
                          a.desde, "2026-12-14", firma, HITOS)
    finally:
        if preparado:
            lab("parar", timeout=300)


if __name__ == "__main__":
    sys.exit(main())
