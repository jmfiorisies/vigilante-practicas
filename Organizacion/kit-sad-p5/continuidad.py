#!/usr/bin/env python3
"""P5 · Bloque C · Comprueba registro.yaml y riesgos.yaml de tu carpeta plan/ (en la máquina datos, montada en /plan).

    continuidad.py formato     → que cada fichero se lee bien y qué huecos quedan vacíos
    continuidad.py comprobar   → las pruebas C8 y C9; la última línea es «RESULTADO bien mal»
"""
import sys
import unicodedata
from pathlib import Path

import yaml

D = Path("/plan")
FICHEROS = ["registro.yaml", "riesgos.yaml"]
TTY = sys.stdout.isatty()
R, V, A, X = ("\033[1;31m", "\033[1;32m", "\033[1;33m", "\033[0m") if TTY else ("", "", "", "")


def llano(v):
    """Texto sin tildes, en minúsculas. Los sí/no de YAML (no → False) vuelven a ser texto."""
    if v is True:
        return "si"
    if v is False:
        return "no"
    if v is None:
        return ""
    return unicodedata.normalize("NFD", str(v)).encode("ascii", "ignore").decode().strip().lower()


def lista(v):
    if v is None:
        return []
    return [llano(x) for x in v] if isinstance(v, list) else [llano(v)]


def leer(nombre):
    try:
        return yaml.safe_load((D / nombre).read_text(encoding="utf-8")) or {}, None
    except FileNotFoundError:
        return {}, "no existe"
    except yaml.YAMLError as e:
        marca = getattr(e, "problem_mark", None)
        return {}, f"no se puede leer (línea {marca.line + 1})" if marca else "no se puede leer"


def nivel(r):
    return "bajo" if r <= 4 else "medio" if r <= 9 else "alto" if r <= 15 else "critico"


def formato():
    for f in FICHEROS:
        d, err = leer(f)
        if err:
            print(f"{R}✘{X} plan/{f}: {err}. ¿Has quitado un «:» o mezclado tabuladores y espacios?")
            continue
        vacios = [k for k, v in d.items() if v in (None, "", [])]
        print(f"{A}!{X} plan/{f}: se lee bien; vacío: {', '.join(vacios)}" if vacios
              else f"{V}✔{X} plan/{f}: se lee bien y no queda nada vacío")


BIEN = MAL = 0


def prueba(desc, cond, pista):
    global BIEN, MAL
    try:
        ok = bool(cond())
    except Exception:
        ok = False
    if ok:
        print(f"{V}✔{X} {desc}")
        BIEN += 1
    else:
        print(f"{R}✘{X} {desc}\n    {A}💡{X} {pista}")
        MAL += 1


def comprobar():
    reg, _ = leer("registro.yaml")
    rie, _ = leer("riesgos.yaml")
    prueba("C8 · Registro: finalidad, base jurídica y plazo de supresión",
           lambda: len(llano(reg.get("finalidad"))) > 10 and llano(reg.get("base_juridica")) == "contrato"
           and len(llano(reg.get("plazo_supresion"))) > 5,
           "¿por qué puede La Taquilla tratar los datos de quien compra una entrada? (UD12: las bases jurídicas)")
    prueba("C8 · Registro: categorías de datos (con los de pago) y sin categorías especiales",
           lambda: any(c.startswith("identificativ") for c in lista(reg.get("categorias_datos")))
           and any(c.startswith("contacto") for c in lista(reg.get("categorias_datos")))
           and any(c.startswith("econom") or c.startswith("pago") or c.startswith("financ") for c in lista(reg.get("categorias_datos")))
           and llano(reg.get("categorias_especiales")) == "no",
           "mira TODAS las columnas de compradores.csv: ¿qué tipo de dato son los últimos números de la tarjeta?")
    prueba("C8 · Registro: el encargado de la nube y tres medidas, entre ellas las copias, el cifrado y la alta disponibilidad",
           lambda: any("nube" in e or "copia" in e for e in lista(reg.get("encargados")))
           and len(lista(reg.get("medidas_seguridad"))) >= 3
           and any("copia" in m for m in lista(reg.get("medidas_seguridad")))
           and any("cifr" in m for m in lista(reg.get("medidas_seguridad")))
           and any("disponib" in m or "balance" in m or "keepalived" in m for m in lista(reg.get("medidas_seguridad"))),
           "¿quién guarda los datos en sus servidores por encargo de La Taquilla? Y las medidas: lo que has montado en A, B y C")

    filas = [r for r in (rie.get("riesgos") or []) if isinstance(r, dict)]
    propias = [r for r in filas if "cambia los precios" not in llano(r.get("amenaza"))]
    campos = ["activo", "dimension", "amenaza", "probabilidad", "impacto", "riesgo", "nivel", "salvaguarda"]
    prueba("C9 · MAGERIT: al menos cuatro riesgos tuyos, con todos los campos y las cuentas bien",
           lambda: len(propias) >= 4 and all(all(r.get(c) not in (None, "") for c in campos) for r in propias)
           and all(1 <= int(r["probabilidad"]) <= 5 and 1 <= int(r["impacto"]) <= 5
                   and int(r["riesgo"]) == int(r["probabilidad"]) * int(r["impacto"])
                   and llano(r["nivel"]) == nivel(int(r["riesgo"])) for r in propias),
           "cada riesgo con sus ocho campos; riesgo = probabilidad × impacto, y el nivel según la escala de la cabecera")
    prueba("C9 · MAGERIT: el ransomware, con su dimensión y con las copias como salvaguarda",
           lambda: any("ransomware" in llano(r.get("amenaza")) and llano(r.get("dimension")) == "disponibilidad"
                       and "copia" in llano(r.get("salvaguarda")) for r in propias),
           "lo que pasó en ./lab.sh desastre: ¿qué se perdió y qué lo salvó?")
    prueba("C9 · MAGERIT: la caída de un balanceador, con su dimensión y con lo del bloque B como salvaguarda",
           lambda: any(("balanceador" in llano(r.get("amenaza")) or "lb1" in llano(r.get("amenaza")))
                       and llano(r.get("dimension")) == "disponibilidad"
                       and any(p in llano(r.get("salvaguarda")) for p in ("keepalived", "vrrp", "ip virtual", "alta disponibilidad", "lb2"))
                       for r in propias),
           "si se va la luz en lb1, ¿qué se pierde? ¿Y qué lo evita?")
    print(f"RESULTADO {BIEN} {MAL}")


if __name__ == "__main__":
    formato() if (sys.argv[1] if len(sys.argv) > 1 else "formato") == "formato" else comprobar()
