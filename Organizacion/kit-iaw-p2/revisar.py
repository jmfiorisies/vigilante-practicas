#!/usr/bin/env python3
"""
revisar.py — (DOCENTE) corrige la ENTREGA de la P2 de IAW (Radio Marea) pasando NUESTRO comprobador al trabajo de cada alumno.

Para cada alumno de GestionDocente/Alumnos/IAW/repos (haz antes ./actualizar.sh):
  1. Elige el commit: el último de main (o master), o el último ANTES de --hasta (la entrega es una sola: --hasta
     "2026-11-27 23:59").
  2. Encuentra su carpeta p2-radio-marea/ (la que tiene servidor/nginx/radio.conf, esté donde esté) y copia SU trabajo
     (servidor/, web/, app/, sql/usuarios.sql) sobre un kit limpio (.runner/p2-radio-marea/) con NUESTRO compose.yaml,
     NUESTRO practica.sh y NUESTRO comprobador: da igual si ha tocado las pruebas. Avisa si las ha cambiado.
  3. radio.env no está en Git (bien hecho): se rehace como lo haría él, con una SECRET_KEY nueva y DB_USER/DB_PASS
     sacados de SU sql/usuarios.sql (radio_web). Si SÍ está en Git, se usa el suyo y se avisa (pierde el punto de secretos).
  4. Arranca (docker compose, proyecto iaw-p2-radio), aplica su usuarios.sql, pasa el comprobador y lo para (down -v).
     Uno detrás de otro: usan los mismos puertos y nombres. Unos 2 min por alumno.

  AVANCES: en cada fecha (HITOS) se hace una FOTO de lo que hay subido en main: solo las pruebas de ese bloque. Hazla
  LA MAÑANA SIGUIENTE, tras ./actualizar.sh. Se guarda en Alumnos/IAW/P2-avance-X.json y la nota final la usa.

  Nota de cada bloque (sobre 10): pruebas ✍️ del bloque 5 (las 👀 no cuentan) + avance en su fecha 2,5
    + configuración válida (nginx -t y la API arranca) 0,5 + sin secretos en el repositorio (radio.env y *.key nunca en Git,
    ni en el historial) 0,5 + Git 1,5 × (commits que tocan los ficheros del bloque, sin el del kit, hasta 4: uno por apartado) ÷ 4.
    Un bloque sin ninguna prueba en verde vale 0 (sin calidad ni Git).
    Nota de la ENTREGA = media de A, B y C (30 % de la práctica; el 70 % es la defensa).

  Uso (todo en Docker: revisar.sh lanza este script dentro de un contenedor):
        bash revisar.sh --avance a                          → la foto del 9/11 (la mañana del 10/11); luego b (17/11) y c (24/11)
        bash revisar.sh --hasta "2026-11-27 23:59"          → la entrega, con los avances
        bash revisar.sh --hasta "2026-11-27 23:59" a1 a2                        → solo esos
        bash revisar.sh --progreso                          → avance semana a semana para el planificador (Alumnos/IAW/P2-progreso.json)

Escribe Alumnos/IAW/P2.md y la entrega para la app de defensas (docs/defensa/practicas/iaw-p2-entregas.json).
No toca los repos.
"""
import argparse, io, json, os, re, secrets, shutil, subprocess, sys, tarfile
from pathlib import Path

AQUI = Path(__file__).resolve().parent
REPOS = AQUI.parents[1] / "Alumnos/IAW/repos"
REPOS_ALUMNOS = REPOS
PLANTILLA = AQUI / "plantilla"
RUNNER = AQUI / ".runner" / "p2-radio-marea"
ALUMNOS_TSV = AQUI.parents[1] / "Alumnos/IAW/alumnos.tsv"
ENTREGAS_APP = AQUI.parent / "docs/defensa/practicas/iaw-p2-entregas.json"

SUYO = ["servidor", "web", "app", "sql/usuarios.sql"]          # lo que se copia de su repositorio
BLOQUES = {"A": ["servidor/nginx", "servidor/php", "web"],      # los ficheros de cada bloque (para el punto de Git)
           "B": ["servidor/nginx", "app", "servidor/gunicorn.conf.py"],
           "C": ["sql/usuarios.sql", "web/inc", "app", "servidor/copia.sh"]}
HITOS = {"A": "2026-11-09 23:59", "B": "2026-11-16 23:59", "C": "2026-11-23 23:59"}
PESOS = {"pruebas": 5, "avance": 2.5, "valida": 0.5, "secretos": 0.5, "git": 1.5}   # 31/10: más proceso, menos resultado
ANCLA = "servidor/nginx/radio.conf"


def git(repo, *args, binario=False):
    r = subprocess.run(["git", "-C", str(repo), *args], capture_output=True)
    return r.stdout if binario else r.stdout.decode(errors="replace").strip()


def elegir_commit(repo, hasta):
    ramas = git(repo, "for-each-ref", "--format=%(refname:short)", "refs/heads").split()
    for r in ("main", "master"):
        if r in ramas:
            c = git(repo, "rev-list", "-1", f"--before={hasta}", r) if hasta else git(repo, "rev-parse", r)
            return r, c or None
    return None, None


def extraer(repo, commit, base, rutas, destino):
    """Copia las rutas (relativas a su p2-radio-marea/) de ese commit dentro de destino."""
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


def rehacer_env(destino):
    """radio.env como lo tendría el alumno: el de la plantilla + SECRET_KEY nueva + radio_web de SU usuarios.sql."""
    sql = (destino / "sql/usuarios.sql").read_text(errors="replace") if (destino / "sql/usuarios.sql").exists() else ""
    sql = "\n".join(l for l in sql.splitlines() if not l.lstrip().startswith("--"))
    creados = re.findall(r"CREATE\s+USER\s+(?:IF\s+NOT\s+EXISTS\s+)?'?(\w+)'?@'[^']*'\s+IDENTIFIED\s+BY\s+'([^']*)'", sql, re.I)
    usuario, clave = next(((u, c) for u, c in creados if u != "radio_copias"), ("", ""))
    env = (PLANTILLA / "servidor/radio.env").read_text()
    env = re.sub(r"(?m)^SECRET_KEY=.*$", "SECRET_KEY=" + secrets.token_hex(32), env)
    env = re.sub(r"(?m)^DB_USER=.*$", "DB_USER=" + usuario, env)
    env = re.sub(r"(?m)^DB_PASS=.*$", "DB_PASS=" + clave, env)
    (destino / "servidor/radio.env").write_text(env)
    return usuario


def preparar(repo, commit, base, fila):
    shutil.rmtree(RUNNER.parent, ignore_errors=True)
    shutil.copytree(PLANTILLA, RUNNER)
    for d in ("servidor", "web", "app"):
        shutil.rmtree(RUNNER / d)
    shutil.copytree(PLANTILLA / "servidor", RUNNER / "servidor")      # por si le falta algún fichero
    extraer(repo, commit, base, SUYO, RUNNER)
    for d in ("web", "app"):                                            # si borró la carpeta, la de la plantilla
        if not (RUNNER / d).exists():
            shutil.copytree(PLANTILLA / d, RUNNER / d)
    if subprocess.run(["git", "-C", str(repo), "cat-file", "-e", f"{commit}:{base}servidor/radio.env"],
                      capture_output=True).returncode == 0:
        fila["obs"].append("⚠️ radio.env en Git: uso el suyo")
    else:
        u = rehacer_env(RUNNER)
        if u != "radio_web":
            fila["obs"].append(f"usuario de la web en usuarios.sql: {u or 'ninguno'}")
    # ¿Ha tocado nuestras pruebas?
    suyo = git(repo, "show", f"{commit}:{base}comprobador/comprobar.sh", binario=True)
    if suyo and suyo.replace(b"\r\n", b"\n") != (PLANTILLA / "comprobador/comprobar.sh").read_bytes():
        fila["obs"].append("⚠️ ha cambiado comprobador/comprobar.sh (se usa el nuestro)")
    for d in ("logs", "copias"):
        (RUNNER / d).mkdir(exist_ok=True)


def practica(*orden, timeout=600):
    return subprocess.run(["bash", "practica.sh", *orden], cwd=RUNNER, capture_output=True, text=True, timeout=timeout)


def pasar(fila, bloque=None):
    """Arranca, aplica usuarios.sql, comprueba (todo o un bloque) y para. Rellena fila['res'] = {id: (tipo, ok)}."""
    res = RUNNER / "resultados.tsv"
    try:
        r = practica("arrancar")
        if r.returncode:
            fila["obs"].append("💥 no arranca: " + (r.stdout + r.stderr).strip().splitlines()[-1][:90])
        else:
            if practica("sql").returncode:
                fila["obs"].append("usuarios.sql para con un error")
            fila["valida"] = subprocess.run(["docker", "compose", "exec", "-T", "nginx", "nginx", "-t"], cwd=RUNNER,
                                            capture_output=True).returncode == 0
            if not fila["valida"]:
                fila["obs"].append("nginx -t falla")
            api = subprocess.run(["docker", "compose", "ps", "--status", "running", "-q", "app"], cwd=RUNNER,
                                 capture_output=True, text=True).stdout.strip()
            if not api:
                fila["valida"] = False
                fila["obs"].append("la API no arranca")
            subprocess.run(["bash", "practica.sh", "comprobar", *([bloque] if bloque else [])], cwd=RUNNER,
                           capture_output=True, timeout=600, env={**os.environ, "RESULTADOS": str(res)})
    except subprocess.TimeoutExpired:
        fila["obs"].append("💥 tiempo agotado")
    finally:
        subprocess.run(["docker", "compose", "down", "-v", "--remove-orphans"], cwd=RUNNER, capture_output=True)
    if res.exists():
        for l in res.read_text().splitlines():
            i, tipo, ok = (l.split("\t") + ["", ""])[:3]
            fila["res"][i] = (tipo, ok == "1")


def secretos_fuera(repo):
    """radio.env y las *.key nunca en Git, en ninguna rama ni en el historial."""
    hist = git(repo, "log", "--all", "--name-only", "--format=")
    return [f for f in sorted(set(hist.splitlines())) if f.endswith("radio.env") or f.endswith(".key")]


def commits_del_bloque(repo, commit, base, bloque):
    return int(git(repo, "rev-list", "--count", commit, "--", *[base + r for r in BLOQUES[bloque]]) or 0)


def revisar(repo, hasta, bloque=None):
    fila = {"alumno": repo.name, "rama": "—", "commit": "", "res": {}, "obs": [], "valida": False}
    rama, commit = elegir_commit(repo, hasta)
    fila["rama"], fila["commit"] = rama or "—", (commit or "")[:7]
    if not commit:
        fila["obs"].append("sin main (o sin commits antes de la fecha)")
        return fila
    anclas = [f for f in git(repo, "ls-tree", "-r", "--name-only", commit).splitlines() if f.endswith(ANCLA)]
    if not anclas:
        fila["obs"].append("sin carpeta p2-radio-marea")
        return fila
    base = anclas[0][: -len(ANCLA)]
    if base.rstrip("/").split("/")[-1] != "p2-radio-marea":
        fila["obs"].append(f"la carpeta es «{base or '(raíz)'}»")
    preparar(repo, commit, base, fila)
    pasar(fila, bloque)
    if not bloque:
        fuera = secretos_fuera(repo)
        fila["secretos"] = not fuera
        if fuera:
            fila["obs"].append("⚠️ en Git: " + ", ".join(fuera[:3]))
        fila["git"] = {b: commits_del_bloque(repo, commit, base, b) for b in BLOQUES}
    return fila


# ------------------------------------------------------------------------------ notas e informe
coma = lambda x: f"{x:.1f}".replace(".", ",")


def pruebas(fila, b):
    """(verdes, total) de las ✍️ del bloque b."""
    xs = [ok for i, (tipo, ok) in fila["res"].items() if i.startswith(b) and tipo != "👀"]
    return sum(xs), len(xs)


def ruta_avance(b):
    return REPOS.parent / f"P2-avance-{b}.json"


def avance(b, alumno):
    ruta = ruta_avance(b)
    if not ruta.exists():
        return None
    d = json.loads(ruta.read_text()).get("alumnos", {}).get(alumno)
    return d["ok"] / d["total"] if d and d.get("total") else 0.0


def nota_bloque(f, b):
    ok, total = pruebas(f, b)
    if not ok:                                          # sin nada hecho en el bloque, tampoco calidad ni Git
        return 0.0
    av = avance(b, f["alumno"])
    return (PESOS["pruebas"] * ok / total + PESOS["avance"] * (av or 0) + PESOS["valida"] * f.get("valida", False)
            + PESOS["secretos"] * f.get("secretos", False) + PESOS["git"] * min(max(f.get("git", {}).get(b, 0) - 1, 0), 4) / 4)   # sin el commit del kit; uno por apartado (4)


def informe(filas, a):
    sin_foto = [b for b in BLOQUES if not ruta_avance(b).exists()]
    lineas = ["# IAW P2 · Radio Marea — corrección automática de la entrega", "",
              "Rama `main`" + (f" · commits hasta {a.hasta}" if a.hasta else ""), "",
              "Nota de cada bloque = pruebas ✍️ 5 + avance en su fecha 2,5 + configuración válida 0,5 + sin secretos en Git 0,5"
              " + Git 1,5 (commits del bloque sin el del kit, hasta 4). Un bloque sin ninguna prueba en verde, 0. **Entrega** = media de los bloques (30 % de la práctica; la defensa, el 70 %, va aparte).",
              ""]
    if sin_foto:
        lineas += [f"⚠️ Sin foto de avance de: {', '.join(sin_foto)} (`--avance`): ese avance cuenta 0.", ""]
    lineas += ["| Alumno | Commit | " + " | ".join(f"{b}: pruebas · avance · **nota**" for b in BLOQUES)
               + " | Válida | Secretos | Commits A/B/C | **Entrega** | Observaciones |",
               "|---|---|" + ":-:|" * (len(BLOQUES) + 4) + "---|"]
    for f in filas:
        celdas, notas = [], []
        for b in BLOQUES:
            ok, total = pruebas(f, b)
            av = avance(b, f["alumno"])
            n = nota_bloque(f, b)
            f.setdefault("notas", {})[b] = n
            notas.append(n)
            celdas.append(f"{ok}/{total} · {'—' if av is None else f'{round(100 * av)} %'} · **{coma(n)}**")
        f["media"] = sum(notas) / len(notas)
        g = f.get("git", {})
        lineas.append(f"| {f['alumno']} | {f['commit']} | " + " | ".join(celdas)
                      + f" | {'✓' if f.get('valida') else '✗'} | {'✓' if f.get('secretos') else '✗'}"
                      + f" | {'/'.join(str(g.get(b, 0)) for b in BLOQUES)} | **{coma(f['media'])}** | {'; '.join(f['obs'])} |")
    ids = sorted({i for f in filas for i, (t, _) in f["res"].items() if t != "👀"})
    lineas += ["", "## Prueba a prueba", "", "| Alumno | " + " | ".join(ids) + " |", "|---|" + ":-:|" * len(ids)]
    for f in filas:
        lineas.append(f"| {f['alumno']} | " + " | ".join(
            ("✔" if f["res"][i][1] else "✘") if i in f["res"] else "—" for i in ids) + " |")
    destino = REPOS.parent / "P2.md"
    destino.write_text("\n".join(lineas) + "\n")
    print(f"\n→ {destino}")
    if REPOS == REPOS_ALUMNOS:
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
            "verdes": sum(pruebas(f, b)[0] for b in BLOQUES), "nota": round(f["media"], 2),
            "fallos": [i for i, (t, ok) in sorted(f["res"].items()) if t != "👀" and not ok],
            "avisos": f["obs"] + [f"{b}: {coma(n)}" for b, n in f["notas"].items()]}
    ENTREGAS_APP.write_text(json.dumps(datos, ensure_ascii=False, indent=1) + "\n")
    print(f"→ {ENTREGAS_APP} (para la app de defensas; se sube con publicar.sh y tu orden)")


def foto_avance(repos, b, solo):
    filas = {}
    for repo in repos:
        f = revisar(repo, HITOS[b], bloque=b)
        ok, total = pruebas(f, b)
        filas[repo.name] = {"commit": f["commit"], "ok": ok, "total": total, "obs": f["obs"]}
        print(f"{repo.name:24} {f['commit']:8} {ok}/{total} {'; '.join(f['obs'])}")
    ruta = ruta_avance(b)
    viejo = json.loads(ruta.read_text())["alumnos"] if ruta.exists() and solo else {}
    viejo.update(filas)
    ruta.write_text(json.dumps({"bloque": b, "hasta": HITOS[b], "alumnos": viejo}, ensure_ascii=False, indent=1) + "\n")
    print(f"\n→ {ruta}")


def main():
    global REPOS
    ap = argparse.ArgumentParser()
    ap.add_argument("alumnos", nargs="*")
    ap.add_argument("--repos", type=Path, default=REPOS, help="carpeta con los repos (por defecto Alumnos/IAW/repos)")
    ap.add_argument("--hasta", help='p. ej. "2026-11-27 23:59": último commit antes de esa hora')
    ap.add_argument("--avance", choices=["a", "b", "c"], help="hace la FOTO de la fecha de avance de ese bloque")
    ap.add_argument("--progreso", action="store_true", help="avance semana a semana (pestaña Repositorios del planificador)")
    ap.add_argument("--desde", default="2026-10-28", help="con --progreso: desde qué día")
    a = ap.parse_args()
    REPOS = a.repos.resolve()
    repos = sorted(p for p in REPOS.iterdir() if (p / ".git").exists())
    if a.alumnos:
        repos = [p for p in repos if p.name in a.alumnos]
    if a.avance:
        return foto_avance(repos, a.avance.upper(), a.alumnos)
    if a.progreso:                                       # avance semana a semana (../tools/progreso.py); solo main
        sys.path.insert(0, str(AQUI.parent / "tools"))
        import progreso

        def contar(f):
            grupos = {}
            for i, (tipo, ok) in f["res"].items():
                if tipo == "👀":
                    continue
                k = i.split(".")[0]
                v = grupos.get(k, (0, 0))
                grupos[k] = (v[0] + ok, v[1] + 1)
            return grupos

        def comprobar(repo, rama, hasta):
            f = revisar(repo, hasta)
            grupos = contar(f)
            # 6/11: en Actions salió una vez 0 verdes en un commit que tenía 3, sin causa encontrada. Lo que se comprueba
            # aquí se guarda por commit y no se repite: un 0 se confirma con otra pasada antes de darlo por bueno.
            if grupos and not any(ok for ok, _ in grupos.values()):
                f = revisar(repo, hasta)
                grupos = contar(f)
            return f["rama"], f["commit"], grupos, f["obs"]
        return progreso.ejecutar("iaw-p2", repos, comprobar, REPOS.parent / "P2-progreso.json", a.desde,
                                 "2026-11-27", progreso.firma(PLANTILLA / "comprobador"), HITOS, ["main", "master"])
    filas = []
    for repo in repos:
        f = revisar(repo, a.hasta)
        filas.append(f)
        print(f"{f['alumno']:24} {f['commit']:8} " + " ".join(f"{b}:{pruebas(f, b)[0]}/{pruebas(f, b)[1]}" for b in BLOQUES)
              + f"  {'; '.join(f['obs'])}")
    informe(filas, a)


if __name__ == "__main__":
    sys.exit(main())
