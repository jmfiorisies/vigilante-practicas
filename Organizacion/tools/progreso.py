"""
progreso.py — (DOCENTE) el AVANCE COMPROBADO de una práctica, semana a semana, para la pestaña 🐙 Repositorios
del planificador. Lo usan los revisar.py de las P2 (opción --progreso): cada uno pone cómo se comprueba un commit
y aquí se decide QUÉ commits comprobar y se guarda el resultado.

  · Fechas: cada domingo a las 23:59 desde --desde hasta hoy (o la entrega) y «ahora».
  · En cada fecha y por alumno: el último commit de CADA rama (se llame como se llame) antes de esa hora; se queda
    el que más verdes tiene (si empatan, el que tiene el proyecto y, luego, el más reciente).
  · Caché por commit (Alumnos/<ASIG>/P2-progreso-cache.json): un commit ya comprobado no se vuelve a pasar,
    salvo que cambien nuestras pruebas (firma).
  · Salida: Alumnos/<ASIG>/P2-progreso.json → {practica, generado, fechas, alumnos: {carpeta: [{fecha, rama,
    commit, grupos: {clave: [verdes, total]}, obs}]}}. La clave es el apartado (A1, B2…) o, en DWEC, el fichero
    de tests (2-recurrente…); el planificador la traduce al apartado con el enunciado.
No toca los repos.
"""
import datetime as dt
import hashlib, json, subprocess
from pathlib import Path


def git(repo, *args):
    return subprocess.run(["git", "-C", str(repo), *args], capture_output=True).stdout.decode(errors="replace").strip()


def firma(*carpetas):
    """Huella de nuestras pruebas: si cambian, la caché no vale."""
    h = hashlib.sha256()
    for c in carpetas:
        c = Path(c)
        for f in sorted(p for p in (c.rglob("*") if c.is_dir() else [c]) if p.is_file()):
            h.update(str(f.relative_to(c.parent)).encode()); h.update(f.read_bytes())
    return h.hexdigest()[:16]


def fechas(desde, hasta=None):
    """Los domingos a las 23:59 entre desde y hasta (o hoy), y None = ahora."""
    hoy = dt.date.today()
    fin = min(dt.date.fromisoformat(hasta), hoy) if hasta else hoy
    d = dt.date.fromisoformat(desde)
    d += dt.timedelta(days=(6 - d.weekday()) % 7)
    out = []
    while d <= fin:
        out.append(f"{d.isoformat()} 23:59")
        d += dt.timedelta(days=7)
    return out + [None]


def ejecutar(practica, repos, comprobar, salida, desde, hasta=None, firma_pruebas="", hitos=None, solo_ramas=None):
    """comprobar(repo, rama, hasta) → (rama usada, commit, grupos {clave: (ok, total)}, obs).
    hitos: {"A": "AAAA-MM-DD 23:59", …} fechas de avance de cada bloque (van a la salida para el planificador).
    solo_ramas: si el comprobador solo mira unas ramas (IAW: main), solo esas."""
    cache_f = salida.with_name(salida.stem + "-cache.json")
    cache = json.loads(cache_f.read_text()) if cache_f.exists() else {}
    if cache.get("_firma") != firma_pruebas:
        cache = {"_firma": firma_pruebas}
    fs = fechas(desde, hasta)
    alumnos = {}
    for repo in repos:
        ramas = git(repo, "for-each-ref", "--format=%(refname:short)", "refs/heads").split()
        if solo_ramas:
            ramas = [r for r in solo_ramas if r in ramas][:1]
        serie = []
        for f in fs:
            mejor = None
            vistos = set()
            for rama in ramas:
                c = git(repo, "rev-list", "-1", f"--before={f}", rama) if f else git(repo, "rev-parse", rama)
                if not c or c in vistos:
                    continue
                vistos.add(c)
                if c not in cache:
                    r, commit, grupos, obs = comprobar(repo, rama, f)
                    cache[c] = {"grupos": {k: list(v) for k, v in grupos.items()}, "obs": obs[:6]}
                    cache_f.write_text(json.dumps(cache, ensure_ascii=False))
                d = cache[c]
                ok = sum(v[0] for v in d["grupos"].values())
                # Gana la rama con más verdes; si empatan (p. ej. 0 y 0), la que tiene el proyecto de la práctica
                # y, después, la del commit más reciente: así no sale «develop · no hay proyecto» cuando el alumno
                # ya trabaja en feature/p2-a o en una rama con otro nombre (3/11: Óscar, Roberto).
                orden = (ok, bool(d["grupos"]), int(git(repo, "log", "-1", "--format=%ct", c) or 0))
                if mejor is None or orden > mejor["_orden"]:
                    mejor = {"fecha": f[:10] if f else "ahora", "rama": rama, "commit": c[:7], "ok": ok,
                             "grupos": d["grupos"], "obs": d["obs"], "_orden": orden}
            if mejor:
                mejor.pop("_orden")
                serie.append(mejor)
        alumnos[repo.name] = serie
        ult = serie[-1] if serie else None
        print(f"{repo.name:24} " + (f"{ult['rama']:16} {ult['commit']} {ult['ok']} verdes" if ult else "sin commits"))
    salida.write_text(json.dumps({"practica": practica, "generado": dt.datetime.now().isoformat(timespec="seconds"),
                                  "fechas": [f[:10] if f else "ahora" for f in fs], "hitos": hitos or {},
                                  "alumnos": alumnos},
                                 ensure_ascii=False, indent=1) + "\n")
    print(f"\n→ {salida}")
