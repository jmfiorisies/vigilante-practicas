#!/usr/bin/env node
// 🔍 Código parecido entre el alumnado de un módulo. Corre en GitHub Actions, con códigos en vez de nombres.
// Es el método de Planificador/tools/parecidos.js (winnowing, el de MOSS), con tres diferencias:
//   · el código de la práctica son los commits de sus fechas, porque aquí no está repos.json;
//   · no compara con la solución, porque las soluciones no suben a GitHub;
//   · no aparta los ficheros que entran en un commit grande: lo que viene del kit ya se descuenta por sus huellas, y
//     apartarlos dejaba fuera lo que el alumno edita después y a quien sube de golpe el trabajo de otro.
// Solo avisa para preguntarlo en la defensa: no detecta código hecho con IA ni copiado de internet.
// Lo usa el vigilante (buscarParecidos). En los registros no escribe nada: solo trabaja con códigos (a1, a2…).
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const K = 18,
    W = 8; // fichas por trozo y ventana del winnowing
const MIN_HUELLAS = 25; // con menos código no se compara: todo saldría «parecido»
const COMUN = 0.4; // huella en más del 40 % de la clase = código común
const UMBRAL = 0.3; // se guardan los pares desde el 30 %
const MAX_TROZOS = 8,
    MAX_LINEAS = 18,
    MAX_BYTES = 200 * 1024;
const CODIGO = /\.(m?js|ts|jsx|tsx|css|scss|html?|php|py|sh|conf|ya?ml|sql|vue)$/i;
const NORMALIZA = /\.(m?js|ts|jsx|tsx|php|py|sh|vue)$/i; // aquí los nombres se igualan
const IGNORAR =
    /(^|\/)(node_modules|dist|build|vendor|\.vite|coverage|\.runner|tests?|__tests__)\/|\.(test|spec)\.[mc]?[jt]sx?$|package-lock\.json$|yarn\.lock$|pnpm-lock\.yaml$|\.min\.(js|css)$|\.map$|bateria|(^|\/)(kit-[^/]*|[^/]*(refuerzo|repaso)[^/]*)\//i;
const RESERVADAS = new Set(
    (
        "break case catch class const continue debugger default delete do else export extends finally for function if import in instanceof let new return super switch this throw try typeof var void while with yield async await of static get set null true false undefined " +
        "echo print array foreach as elseif endif endforeach public private protected namespace use require require_once include include_once fn match isset empty die exit " +
        "def lambda pass elif from global nonlocal not and or is None True False raise except assert del " +
        "then fi esac done local readonly declare"
    ).split(" "),
);

const git = (dir, args) =>
    execFileSync("git", ["-c", "core.quotepath=false", "-C", dir, ...args], {
        encoding: "utf8",
        maxBuffer: 64 << 20,
        stdio: ["ignore", "pipe", "ignore"],
    });
const hash32 = (s) => {
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
};
const r3 = (v) => Math.round(v * 1000) / 1000;

// Fichas de un fichero: sin comentarios, y en los lenguajes de programa con los nombres, textos y números igualados
function fichas(texto, nombre) {
    const normaliza = NORMALIZA.test(nombre),
        blanco = (m) => m.replace(/[^\n]/g, " ");
    let s = texto.replace(/\/\*[\s\S]*?\*\//g, blanco).replace(/<!--[\s\S]*?-->/g, blanco);
    s = s.replace(/(^|[^:"'`\\])\/\/[^\n]*/g, (m, a) => a + blanco(m.slice(a.length)));
    if (/\.(py|sh|ya?ml|conf|php)$/i.test(nombre))
        s = s.replace(/(^|\s)#[^\n]*/g, (m, a) => a + blanco(m.slice(a.length)));
    const out = [],
        re =
            /("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\d[\d.]*)|([A-Za-z_$][\w$-]*)|(\n)|([^\s\w])/g;
    let m,
        linea = 1;
    while ((m = re.exec(s))) {
        if (m[4]) {
            linea++;
            continue;
        }
        let t;
        if (m[1]) {
            t = normaliza ? "S" : m[1].toLowerCase();
            linea += (m[1].match(/\n/g) || []).length;
        } else if (m[2]) t = normaliza ? "N" : m[2];
        else if (m[3]) t = normaliza && !RESERVADAS.has(m[3]) ? "V" : m[3].toLowerCase();
        else t = m[5];
        out.push({ t, l: linea });
    }
    return out;
}

function huellas(texto, nombre) {
    const fs_ = fichas(texto, nombre),
        hs = [];
    for (let i = 0; i + K <= fs_.length; i++)
        hs.push({
            h: hash32(
                fs_
                    .slice(i, i + K)
                    .map((x) => x.t)
                    .join("\u0001"),
            ),
            a: fs_[i].l,
            b: fs_[i + K - 1].l,
        });
    const elegidas = new Map();
    for (let i = 0; i + W <= Math.max(hs.length, W); i++) {
        const ventana = hs.slice(i, i + W);
        if (!ventana.length) break;
        const min = ventana.reduce((x, y) => (y.h <= x.h ? y : x));
        if (!elegidas.has(min.h)) elegidas.set(min.h, [min.a, min.b]);
    }
    return elegidas;
}

export function huellasDe(ficheros) {
    const m = new Map();
    ficheros.forEach((f, i) => {
        for (const [h, [a, b]] of huellas(f.texto, f.ruta)) {
            if (!m.has(h)) m.set(h, []);
            m.get(h).push({ f: i, a, b });
        }
    });
    return m;
}

function trozos(A, B, comunes) {
    const pares = comunes
        .map((h) => {
            const x = A.hs.get(h)[0],
                y = B.hs.get(h)[0];
            return { fa: x.f, a1: x.a, a2: x.b, fb: y.f, b1: y.a, b2: y.b };
        })
        .sort((p, q) => p.fa - q.fa || p.a1 - q.a1);
    const grupos = [];
    for (const p of pares) {
        const g = grupos.at(-1);
        if (g && g.fa === p.fa && g.fb === p.fb && p.a1 <= g.a2 + 2) {
            g.a2 = Math.max(g.a2, p.a2);
            g.b1 = Math.min(g.b1, p.b1);
            g.b2 = Math.max(g.b2, p.b2);
            g.n++;
        } else grupos.push({ ...p, n: 1 });
    }
    const lineas = (f, a, b) =>
        f.texto
            .split("\n")
            .slice(a - 1, Math.min(b, a + MAX_LINEAS - 1))
            .join("\n");
    return grupos
        .sort((p, q) => q.n - p.n)
        .slice(0, MAX_TROZOS)
        .map((g) => {
            const fa = A.ficheros[g.fa],
                fb = B.ficheros[g.fb];
            return {
                n: g.n,
                a: { ruta: fa.ruta, desde: g.a1, hasta: g.a2, codigo: lineas(fa, g.a1, g.a2) },
                b: { ruta: fb.ruta, desde: g.b1, hasta: g.b2, codigo: lineas(fb, g.b1, g.b2) },
            };
        });
}

// Compara el código de toda la clase. alumnos: [{ codigo, ficheros: [{ ruta, texto }] }] · base: los ficheros del kit
// profesor: huellas de todo su material (kits de otras prácticas, apuntes), sin el código
export function comparar(alumnos, base, profesor = []) {
    const clase = alumnos.map((a) => ({ ...a, hs: huellasDe(a.ficheros) }));
    const fuera = new Set([...huellasDe(base).keys(), ...profesor]),
        veces = new Map();
    for (const al of clase) for (const h of al.hs.keys()) veces.set(h, (veces.get(h) || 0) + 1);
    const tope = Math.max(2, Math.ceil(clase.length * COMUN));
    for (const [h, n] of veces) if (n > tope) fuera.add(h);
    for (const al of clase) {
        al.propias = new Set([...al.hs.keys()].filter((h) => !fuera.has(h)));
        const deTipo = (logica) =>
            new Set(
                [...al.propias].filter((h) =>
                    al.hs.get(h).some((x) => NORMALIZA.test(al.ficheros[x.f].ruta) === logica),
                ),
            );
        al.logica = deTipo(true);
        al.resto = deTipo(false);
    }
    const parecido = (x, y) => {
        if (x.size < MIN_HUELLAS || y.size < MIN_HUELLAS) return null;
        const [peq, gra] = x.size <= y.size ? [x, y] : [y, x],
            comunes = [...peq].filter((h) => gra.has(h));
        return { pct: comunes.length / peq.size, comunes };
    };
    // Con bastante código de programa, el parecido se mide con ese: estilos, HTML y configuración se parecen mucho más por sí solos
    const medir = (a, b) => {
        const l = parecido(a.logica, b.logica);
        if (l) return { mide: "código", ...l, resto: parecido(a.resto, b.resto) };
        const t = parecido(a.propias, b.propias);
        return t && { mide: "todo", ...t, resto: null };
    };
    const pares = [];
    for (let i = 0; i < clase.length; i++)
        for (let j = i + 1; j < clase.length; j++) {
            const a = clase[i],
                b = clase[j],
                m = medir(a, b);
            if (m && m.pct >= UMBRAL)
                pares.push({
                    a: a.codigo,
                    b: b.codigo,
                    pct: r3(m.pct),
                    mide: m.mide,
                    resto: m.resto ? r3(m.resto.pct) : null,
                    comunes: m.comunes.length,
                    huellas: [a.propias.size, b.propias.size],
                    trozos: trozos(a, b, m.comunes),
                });
        }
    return {
        comparados: clase.length,
        pocos: clase.filter((a) => a.propias.size < MIN_HUELLAS).map((a) => a.codigo),
        pares: pares.sort((x, y) => y.pct - x.pct),
    };
}

// Los ficheros de un kit, sin la solución ni el material del docente
function ficherosDe(dir, base = dir, out = []) {
    let es;
    try {
        es = readdirSync(dir, { withFileTypes: true });
    } catch {
        return out;
    }
    for (const e of es) {
        const p = join(dir, e.name),
            rel = relative(base, p);
        if (IGNORAR.test(rel + (e.isDirectory() ? "/" : "")) || /^(solucion|docente)(\/|$)/.test(rel)) continue;
        if (e.isDirectory()) ficherosDe(p, base, out);
        else if (CODIGO.test(e.name) && statSync(p).size <= MAX_BYTES)
            out.push({ ruta: rel, texto: readFileSync(p, "utf8") });
    }
    return out;
}

// El código de la práctica: lo que tocan los commits de sus fechas, como queda en el último que lo toca, en la rama que sea
export function codigoAlumno(dir, desde, hasta) {
    const commits = git(dir, [
        "log",
        "--all",
        "--no-merges",
        "--reverse",
        `--since=${desde} 00:00:00`,
        `--until=${hasta} 23:59:59`,
        "--format=%H %ct",
    ])
        .split("\n")
        .filter(Boolean)
        .map((l) => l.split(" "));
    const toque = new Map();
    for (const [h, fecha] of commits)
        for (const l of git(dir, ["show", "--name-status", "--no-renames", "--format=", h])
            .split("\n")
            .filter(Boolean)) {
            const [st, r] = l.split("\t");
            if (!r || !CODIGO.test(r) || IGNORAR.test(r)) continue;
            const prev = toque.get(r);
            if (!prev || Number(fecha) >= prev.fecha) toque.set(r, { h, fecha: Number(fecha), borrado: st === "D" });
        }
    const out = [];
    for (const [ruta, t] of toque) {
        if (t.borrado) continue;
        let texto;
        try {
            texto = git(dir, ["show", `${t.h}:${ruta}`]);
        } catch {
            continue;
        }
        if (texto.length <= MAX_BYTES && !texto.includes("\u0000")) out.push({ ruta, texto });
    }
    return out;
}

// Los parecidos de una práctica, para el vigilante (validador/vigilante.mjs). repos: carpeta con un clon por código ·
// kit: carpeta del kit (sin él, solo se descuenta lo común de la clase) · material: huellas-profesor.json, si lo hay
export function buscarParecidos({ repos, kit, material, desde, hasta }) {
    const alumnos = readdirSync(repos)
        .sort()
        .map((codigo) => ({ codigo, ficheros: codigoAlumno(join(repos, codigo), desde, hasta) }))
        .filter((a) => a.ficheros.length);
    const profesor = material && existsSync(material) ? JSON.parse(readFileSync(material, "utf8")).huellas : [];
    return {
        generado: new Date().toISOString(),
        metodo: { K, W, COMUN, UMBRAL, MIN_HUELLAS },
        desde,
        hasta,
        ...comparar(alumnos, kit && existsSync(kit) ? ficherosDe(kit) : [], profesor),
    };
}
