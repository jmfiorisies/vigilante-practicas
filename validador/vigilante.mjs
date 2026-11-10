#!/usr/bin/env node
// 👁 El vigilante de prácticas (docs/practicas-auto.md). Pide trabajo al panel con la clave de máquina, mira qué
// repositorios tienen commits nuevos, pide al panel que relea sus commits, pasa el kit alumno a alumno y le envía cada
// resultado en cuanto lo tiene; si toca, también los parecidos. Corre igual en la GitHub Action (vigilante.yml, repo
// público) y en local (./panel.sh vigilante USUARIO una|seguir).
// En los registros solo salen códigos (a3), módulo y práctica: nunca nombres, usuarios ni URLs.
//
// Uso: node validador/vigilante.mjs una|seguir|cerrar
//   cerrar: lo que este run dejó abierto en el panel pasa a «mal» (el último paso de vigilante.yml, por si se cortó)
// Entorno: PANEL_URL · PANEL_CLAVE (o PANEL_CLAVE_FICHERO) · ORIGEN (github o local) · KITS (carpeta con los kit-*)
//          · TRABAJO (carpeta para los clones y la lista de lo abierto) · PEDIDO_MODULO, PEDIDO_PRACTICA, PEDIDO_QUIEN,
//          PEDIDO_PARECIDOS (Run workflow) · GITHUB_RUN_ID
import { execFileSync, spawnSync } from "node:child_process";
import { appendFileSync, closeSync, existsSync, mkdirSync, openSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buscarParecidos } from "./parecidos.mjs";

const VUELTAS = 5; // tras una tarea se vuelve a pedir trabajo por si se ha encolado algo, como mucho estas veces
const URL_REPO = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/;
const CODIGO = /^a[1-9]\d{0,4}$/; // como en back/lib/vigilante.js

export class ErrorPanel extends Error {
    constructor(status, mensaje) {
        super(mensaje);
        this.status = status;
    }
}

// ── Lo puro (pruebas/unidad/vigilante-accion.mjs) ──

// Lo que se pide desde «Run workflow». Sin módulo, nada: la Action recoge lo que haya en cola en el panel
export function pedidoDe(env) {
    const modulo = (env.PEDIDO_MODULO || "").trim();
    if (!modulo || modulo === "cola") return null;
    const practica = (env.PEDIDO_PRACTICA || "").trim(),
        quien = (env.PEDIDO_QUIEN || "nuevos").trim();
    if (
        !/^[A-Z]{2,6}$/.test(modulo) ||
        !/^P\d{1,2}$/.test(practica) ||
        !(["nuevos", "todos"].includes(quien) || CODIGO.test(quien))
    )
        throw new Error("El pedido no vale: módulo (SAD), práctica (P2) y quién (nuevos, todos o un código como a3).");
    return { modulo, practica, quien, parecidos: /^(true|sí|si|1)$/i.test(env.PEDIDO_PARECIDOS || "") };
}

// Las puntas de las ramas según «git ls-remote --heads»: los SHA, sin repetir y en orden
export function puntasDe(salida) {
    const shas = salida
        .split("\n")
        .map((l) => l.split("\t")[0].trim())
        .filter((s) => /^[0-9a-f]{40}$/.test(s));
    return [...new Set(shas)].sort();
}

// A quién se comprueba. leidas: { codigo: [sha] o null si no se ha podido leer }
export function quienesToca(alumnos, leidas, quien) {
    if (quien === "todos") return alumnos;
    if (quien !== "nuevos") return alumnos.filter((alumno) => alumno.codigo === quien);
    return alumnos.filter((alumno) => leidas[alumno.codigo]?.some((sha) => !alumno.puntas.includes(sha)));
}

// El kit no ve nada del vigilante: ni la clave del panel ni lo de GitHub. Solo lo justo para git, python y docker
export function entornoLimpio(env) {
    const deja = ["PATH", "HOME", "USER", "LANG", "LC_ALL", "TZ", "TMPDIR", "DOCKER_HOST"];
    const limpio = Object.fromEntries(deja.filter((k) => env[k] !== undefined).map((k) => [k, env[k]]));
    return { ...limpio, GIT_TERMINAL_PROMPT: "0" };
}

// Lo que GitHub tiene que tapar en los registros: la URL, «usuario/repo» y el usuario
export function mascaras(alumnos) {
    const out = new Set();
    for (const { url } of alumnos) {
        const [usuario, repo] = url
            .replace("https://github.com/", "")
            .replace(/\.git$/, "")
            .split("/");
        out.add(url).add(`${usuario}/${repo}`).add(usuario);
    }
    return [...out].map((x) => `::add-mask::${x}`);
}

// La foto «ahora» de un alumno en lo que deja revisar.py --progreso ({ hitos, alumnos: { a3: [fotos] } })
export function fotoDe(progreso, codigo) {
    const ultima = progreso.alumnos?.[codigo]?.at(-1);
    if (ultima?.fecha !== "ahora") return null;
    const { fecha, rama, commit, ok, grupos, obs } = ultima;
    return { fecha, rama, commit, ok, grupos, obs };
}

export const verdes = (foto) =>
    Object.values(foto.grupos || {})
        .reduce(([ok, total], [a, b]) => [ok + a, total + b], [0, 0])
        .join("/");

// ── Hablar con el panel ──

const leerAjustes = (env) => ({
    url: (env.PANEL_URL || "").replace(/\/$/, ""),
    clave: (env.PANEL_CLAVE || (env.PANEL_CLAVE_FICHERO ? readFileSync(env.PANEL_CLAVE_FICHERO, "utf8") : "")).trim(),
    origen: env.ORIGEN === "local" ? "local" : "github",
    run: Number(env.GITHUB_RUN_ID) || undefined,
    kits: resolve(env.KITS || "Organizacion"),
    trabajo: resolve(env.TRABAJO || join(env.RUNNER_TEMP || "/tmp", "vigilante")),
    enActions: env.GITHUB_ACTIONS === "true",
});

export function conPanel({ url, clave }) {
    return async (ruta, cuerpo, segundos = 60) => {
        const r = await fetch(`${url}/api/maquina/${ruta}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${clave}`, "Content-Type": "application/json" },
            body: JSON.stringify(cuerpo),
            signal: AbortSignal.timeout(segundos * 1000),
        });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new ErrorPanel(r.status, d.error || `El panel ha respondido ${r.status}.`);
        return d;
    };
}

// ── Git y el kit (sin enseñar nada de su salida) ──

const hoyMadrid = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Madrid" }).format(new Date());

function leerPuntas(url, env) {
    try {
        const salida = execFileSync("git", ["ls-remote", "--heads", "--", url], {
            env,
            encoding: "utf8",
            timeout: 60_000,
            stdio: ["ignore", "pipe", "ignore"],
        });
        return puntasDe(salida);
    } catch {
        return null;
    }
}

function clonar(url, dir, env) {
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    const r = spawnSync("git", ["clone", "-q", "--mirror", "--", url, join(dir, ".git")], {
        env,
        stdio: "ignore",
        timeout: 300_000,
    });
    if (r.status === 0) spawnSync("git", ["-C", dir, "config", "core.bare", "false"], { env, stdio: "ignore" });
    return r.status === 0;
}

// revisar.py deja <carpeta de repos>/../P<N>-progreso.json; aquí, uno a uno y solo con el código de este alumno
function pasarKit(kit, base, codigo, env, guardarSalida) {
    for (const f of readdirSync(base)) if (/-progreso\.json$/.test(f)) rmSync(join(base, f));
    const salida = guardarSalida ? openSync(join(base, "kit.log"), "w") : "ignore";
    const r = spawnSync(
        "python3",
        ["revisar.py", "--progreso", "--desde", hoyMadrid(), "--repos", join(base, "repos"), codigo],
        { cwd: kit, env, stdio: ["ignore", salida, salida], timeout: 40 * 60_000 },
    );
    if (guardarSalida) closeSync(salida);
    const fichero = readdirSync(base).find((f) => /-progreso\.json$/.test(f));
    if (r.status !== 0 || !fichero) return { aviso: `el kit falló (${r.status ?? "tiempo"})` };
    const progreso = JSON.parse(readFileSync(join(base, fichero), "utf8"));
    // Qué prueba es cada apartado (lo deja tools/validador-kits.sh al subir los kits, sacado del enunciado)
    const fApartados = join(kit, "apartados.json");
    const apartados = existsSync(fApartados) ? JSON.parse(readFileSync(fApartados, "utf8")) : undefined;
    return { foto: fotoDe(progreso, codigo), hitos: progreso.hitos, apartados };
}

// ── Una tarea: una práctica ──

async function hacerTarea(t, panel, ajustes, log) {
    const nombre = `${t.modulo} ${t.practica}`,
        env = entornoLimpio(process.env);
    const avisar = (cuerpo) => panel("estado", { ejecucion: t.ejecucion, ...cuerpo });
    if (ajustes.enActions) mascaras(t.alumnos).forEach((m) => console.log(m));
    // Van a nombres de carpeta: solo letras, números y guiones
    if (!/^[A-Za-z0-9]{1,20}$/.test(t.modulo + t.practica) || (t.kit && !/^kit-[a-z0-9-]+$/.test(t.kit)))
        throw new Error("tarea mal formada");
    // Sin el kit, todos saldrían «el kit falló» y se volverían a intentar en cada vuelta
    if (t.kit && !existsSync(join(ajustes.kits, t.kit, "revisar.py"))) {
        log(`${nombre} · ✘ falta ${t.kit}`);
        await avisar({ estado: "mal", aviso: `falta ${t.kit} en el repo del vigilante` });
        return;
    }
    const alumnos = t.alumnos.filter((x) => CODIGO.test(x.codigo) && URL_REPO.test(x.url.replace(/\.git$/, "")));
    const base = join(ajustes.trabajo, `${t.modulo}-${t.practica}`),
        repos = join(base, "repos");
    rmSync(repos, { recursive: true, force: true });
    mkdirSync(repos, { recursive: true });

    const leidas = {};
    for (const alumno of alumnos) leidas[alumno.codigo] = leerPuntas(alumno.url, env);
    const elegidos = quienesToca(alumnos, leidas, t.quien);
    await avisar({ estado: "marcha", codigos: elegidos.map((alumno) => alumno.codigo) });
    log(`${nombre} · ${elegidos.length} de ${alumnos.length} (${t.quien})`);

    const clonados = new Set();
    for (const alumno of elegidos) {
        const mal = (aviso) =>
            avisar({ codigo: alumno.codigo, alumno: "mal", aviso }).then(() =>
                log(`${nombre} · ${alumno.codigo} · ${aviso}`),
            );
        try {
            if (!leidas[alumno.codigo]) {
                await mal("no se pudo leer el repositorio");
                continue;
            }
            await avisar({ codigo: alumno.codigo, alumno: "leyendo" });
            // El panel lee los commits de GitHub por páginas: se le pide hasta que dice que ha acabado
            let r,
                veces = 0;
            do {
                r = await panel("releer", { ejecucion: t.ejecucion, codigo: alumno.codigo }, 120);
            } while (r.sigue && ++veces < 30);
            const resultado = {
                ejecucion: t.ejecucion,
                codigo: alumno.codigo,
                puntas: leidas[alumno.codigo],
                foto: null,
            };
            if (t.kit) {
                await avisar({ codigo: alumno.codigo, alumno: "comprobando" });
                if (!clonar(alumno.url, join(repos, alumno.codigo), env)) {
                    await mal("no se pudo clonar");
                    continue;
                }
                clonados.add(alumno.codigo);
                const { foto, hitos, apartados, aviso } = pasarKit(
                    join(ajustes.kits, t.kit),
                    base,
                    alumno.codigo,
                    env,
                    !ajustes.enActions,
                );
                if (aviso) {
                    await mal(aviso);
                    continue;
                }
                Object.assign(resultado, { foto }, hitos && { hitos }, apartados && { apartados });
            }
            await panel("resultado", resultado);
            log(
                `${nombre} · ${alumno.codigo} · ${resultado.foto ? verdes(resultado.foto) : t.kit ? "sin commits" : "leído"}`,
            );
        } catch (e) {
            if (e instanceof ErrorPanel && [401, 409, 503].includes(e.status)) throw e;
            await mal(e instanceof ErrorPanel ? "el panel no lo aceptó" : "falló al comprobarlo");
        }
    }

    if (t.parecidos) {
        const { desde, hasta } = t.parecidos;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(desde) || !/^\d{4}-\d{2}-\d{2}$/.test(hasta)) throw new Error("fechas mal");
        for (const alumno of alumnos)
            if (!clonados.has(alumno.codigo) && leidas[alumno.codigo])
                clonar(alumno.url, join(repos, alumno.codigo), env);
        const kit = join(ajustes.kits, t.kit || `kit-${t.modulo.toLowerCase()}-${t.practica.toLowerCase()}`);
        const resultado = buscarParecidos({
            repos,
            kit,
            material: join(ajustes.kits, "huellas-profesor.json"),
            desde,
            hasta,
        });
        const { pares } = await panel("parecidos", { ejecucion: t.ejecucion, resultado }, 120);
        log(`${nombre} · parecidos · ${resultado.comparados} comparados, ${pares} pares`);
    }
    await avisar({ estado: "bien" });
}

// Las ejecuciones que ha recogido este proceso, por si se corta: «cerrar» las pasa a «mal»
const ficheroAbiertas = (ajustes) => join(ajustes.trabajo, "abiertas.txt");

// Una vuelta: pide trabajo hasta que no quede (como mucho VUELTAS veces). Devuelve cuántas tareas ha hecho
export async function vuelta(ajustes, panel, pedido = null, log = console.log) {
    let hechas = 0;
    for (let i = 0; i < VUELTAS; i++) {
        const { tareas = [] } = await panel("trabajo", {
            origen: ajustes.origen,
            run: ajustes.run,
            ...(pedido && { pedido }),
        });
        pedido = null;
        if (!tareas.length) break;
        mkdirSync(ajustes.trabajo, { recursive: true });
        appendFileSync(ficheroAbiertas(ajustes), tareas.map((t) => `${t.ejecucion}\n`).join(""));
        for (const t of tareas) {
            try {
                await hacerTarea(t, panel, ajustes, log);
            } catch (e) {
                if (e instanceof ErrorPanel && e.status === 401) throw e;
                if (e instanceof ErrorPanel && e.status === 409)
                    log(`${t.modulo} ${t.practica} · el panel ya la había cerrado`);
                else {
                    const aviso = e instanceof ErrorPanel ? e.message.slice(0, 200) : "se cortó la comprobación";
                    log(`${t.modulo} ${t.practica} · ✘ ${aviso}`);
                    await panel("estado", { ejecucion: t.ejecucion, estado: "mal", aviso }).catch(() => {});
                }
            }
            hechas++;
        }
    }
    return hechas;
}

// Tras un corte (tiempo agotado, cancelada, el runner caído): lo que quedó abierto pasa a «mal». Las que ya estaban
// cerradas, el panel las rechaza con 409 y no pasa nada.
export async function cerrar(ajustes, panel) {
    const fichero = ficheroAbiertas(ajustes);
    if (!existsSync(fichero)) return 0;
    const ids = [...new Set(readFileSync(fichero, "utf8").split("\n").filter(Boolean).map(Number))];
    let cerradas = 0;
    for (const ejecucion of ids)
        await panel("estado", { ejecucion, estado: "mal", aviso: "se cortó en GitHub" })
            .then(() => cerradas++)
            .catch(() => {});
    rmSync(fichero, { force: true });
    return cerradas;
}

async function principal(modo) {
    if (!["una", "seguir", "cerrar"].includes(modo)) {
        console.error("Uso: node validador/vigilante.mjs una|seguir|cerrar");
        process.exit(2);
    }
    const ajustes = leerAjustes(process.env);
    if (!ajustes.url || !ajustes.clave) {
        console.error("✘ Faltan PANEL_URL y PANEL_CLAVE (en GitHub: Settings › Secrets and variables › Actions).");
        process.exit(2);
    }
    const panel = conPanel(ajustes);
    if (modo === "cerrar") {
        console.log(`Cerradas: ${await cerrar(ajustes, panel)}`);
        return;
    }
    rmSync(ficheroAbiertas(ajustes), { force: true });
    let pedido;
    try {
        pedido = pedidoDe(process.env);
    } catch (e) {
        console.error(`✘ ${e.message}`);
        process.exit(2);
    }
    for (;;) {
        try {
            const n = await vuelta(ajustes, panel, pedido);
            pedido = null;
            if (!n && modo === "una") console.log("Nada que hacer en esta vuelta.");
        } catch (e) {
            if (e instanceof ErrorPanel) console.error(`✘ ${e.message}`);
            else console.error(`✘ No se ha podido hablar con el panel${ajustes.enActions ? "" : `: ${e.message}`}`);
            if (modo === "una" || (e instanceof ErrorPanel && e.status === 401)) process.exit(1);
        }
        if (modo === "una") return;
        await new Promise((r) => setTimeout(r, 60_000)); // seguir: una vuelta cada minuto
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) principal(process.argv[2]);
