// comprobar.mjs — El comprobador de la Práctica 4 de DIW (Cita Fácil, el Consultorio Los Alcatraces).
//     docker compose run --rm web npm run comprobar        (todo)
//     docker compose run --rm web npm run comprobar a      (solo el bloque A, con un 💡 en cada apartado)
// Lee tus .md (revision, informe, declaracion, evaluacion y verificacion), monta cada página en un navegador de
// mentira (happy-dom), la usa como lo haría un paciente y mira el CSS compilado. Te dice qué falla, NO la solución.
//
//   node comprobador/comprobar.mjs [a|b|c|d]   → resumen con colores
//   node comprobador/comprobar.mjs --json      → resultado en JSON
import { existsSync } from "node:fs";
import { join } from "node:path";
import * as sass from "sass";
import { RAIZ, leer, pintar, axe, cargar, PAGINAS } from "./navegador.mjs";

const ARGS = process.argv.slice(2);
const JSON_OUT = ARGS.includes("--json");
const SOLO = ARGS.find((a) => /^[abcd]$/i.test(a))?.toUpperCase();
const color = process.stdout.isTTY && !JSON_OUT;
const c = (n, t) => (color ? `\x1b[${n}m${t}\x1b[0m` : t);
const espacios = (t) => String(t ?? "").replace(/[\s\u00a0]+/g, " ").trim();
const sinTildes = (t) => espacios(t).normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
const $ = (raiz, s) => raiz.querySelector(s);
const $$ = (raiz, s) => [...raiz.querySelectorAll(s)];
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const listaAxe = (v) => v.map((x) => `«${x.id}» (${x.nodes.length})`).join(", ");
const conPista = (pista) => Object.assign(new Error(pista), { pista });

const EMPEZAR = {
  "A1.1": "abre cada página con el teclado (Tab, Intro, Espacio), mira el código y pasa npm run auditar: una fila por barrera",
  "A1.2": "el principio sale del primer número del criterio: 1 perceptible, 2 operable, 3 comprensible, 4 robusto",
  "A2.1": "cada servicio, un <h3> con un <button type=\"button\"> dentro, con aria-expanded y aria-controls (el id de su panel)",
  "A2.2": "en src/paginas/horario.js: al pulsar, cambia aria-expanded y el hidden de su panel",
  "A3.1": "en mi-cita.html, un <label for=\"codigo\"> visible; el error, en una región que se lee sola (role=\"alert\"), unido al campo; en src/paginas/mi-cita.js, aria-invalid y el foco al campo",
  "A4.1": "el alt del mapa dice dónde está el consultorio (lo que ve quien mira el mapa); y lang=\"es\" en las cuatro páginas",
  "A4.3": "el color se cambia en el token de _tokens.scss, y solo ahí",
  "A4.4": "en _base.scss: fuera el outline: none; un :focus-visible con un outline que se vea",
  "B1.1": "F12 → modo dispositivo a 320 px; F12 → Rendering: forced-colors y prefers-reduced-motion; y abre el folleto",
  "B1.3": "el alcance: qué páginas, con qué herramientas y con qué navegadores y tecnologías",
  "B2.1": "la tabla del horario: que ocupe lo que hay (width: 100%) o que se desplace ella sola, dentro de su caja",
  "B2.2": "«Cerrado» se dice con texto en la celda; el color, si quieres, de adorno",
  "B2.3": "con colores forzados el fondo del botón desaparece: un borde transparente lo mantiene a la vista",
  "B2.4": "el latido: unas pocas veces (5 s como mucho) y nada con @media (prefers-reduced-motion: reduce)",
  "B3.2": "lo que NO cumple aún, con su criterio y una fecha para arreglarlo",
  "C1.1": "el objetivo, en una frase; y al menos dos tipos de paciente, cada uno en una línea «- …»",
  "C1.2": "una fila por problema, con la heurística de Nielsen (número y nombre) y la gravedad (0 a 4)",
  "C2.1": "lo que un paciente no lleva encima no puede ser obligatorio; y el motivo, con sus palabras",
  "C2.2": "en src/paginas/cita.js, la función Huecos(): un botón de radio por cada hueco LIBRE de src/datos/huecos.js",
  "C2.3": "un mensaje junto a cada campo (aria-describedby) que diga cómo arreglarlo, «por ejemplo …»",
  "C2.4": "la confirmación dice el día, la hora y con quién, en un role=\"status\"",
  "C3.1": "type y autocomplete: name, bday, tel",
  "D1.1": "una tarea dice lo que la persona QUIERE CONSEGUIR, nunca dónde pulsar",
  "D1.2": "lee sesiones.md y pon, para cada persona y cada tarea, «sí», «no» o «con ayuda»",
  "D1.3": "el SUS: en las impares, respuesta − 1; en las pares, 5 − respuesta; súmalo y × 2,5",
  "D1.4": "tasa de éxito = los «sí» ÷ los intentos × 100; el SUS medio, la media de los tres",
  "D1.5": "prueba tú: con el dedo (modo dispositivo), solo teclado, el ratón, Slow 4G y otro motor de navegador",
  "D2.1": "en _cita.scss, que «Anular» se vea siempre; el efecto del ratón, dentro de @media (hover: hover)",
  "D2.2": "los iconos: min-width y min-height de 2.75rem (44 px); el dibujo puede seguir pequeño",
  "D3.1": "la portada es lo más grande (el LCP): fuera loading=\"lazy\", y con width y height",
  "D3.2": "el aviso de la gripe, en index.html desde el principio; fuera el setTimeout de src/paginas/inicio.js",
};

// ───────────── el CSS de verdad (el SCSS compilado), con sus @media ─────────────
let css = "";
let errorCss = "";
try {
  css = sass.compile(join(RAIZ, "scss/main.scss"), { style: "expanded" }).css;
} catch (e) {
  errorCss = e.message.split("\n")[0];
}
/** Todas las reglas «selector { declaraciones }», cada una con el @media en el que está (o "") */
function leerReglas(texto) {
  const out = [];
  const pila = [];
  let i = 0;
  let inicio = 0;
  texto = texto.replace(/\/\*[\s\S]*?\*\//g, "");
  while (i < texto.length) {
    const ch = texto[i];
    if (ch === "{") {
      const cab = espacios(texto.slice(inicio, i));
      if (cab.startsWith("@")) {
        pila.push(cab);
        inicio = i + 1;
      } else {
        const fin = texto.indexOf("}", i);
        const cuerpo = texto.slice(i + 1, fin);
        out.push({
          sel: cab,
          media: pila.filter((p) => p.startsWith("@media")).join(" "),
          enKeyframes: pila.some((p) => p.includes("keyframes")),
          decl: Object.fromEntries([...cuerpo.matchAll(/([\w-]+)\s*:\s*([^;]+);?/g)].map((d) => [d[1].trim(), d[2].trim()])),
        });
        i = fin;
        inicio = fin + 1;
      }
    } else if (ch === "}") {
      pila.pop();
      inicio = i + 1;
    } else if (ch === ";" && !pila.length) {
      inicio = i + 1;
    }
    i++;
  }
  return out;
}
const reglas = leerReglas(css).filter((r) => !r.enKeyframes);
const deSelector = (selector) => reglas.filter((r) => r.sel.split(",").some((s) => s.trim() === selector));
const propiedad = (selector, prop) => {
  let v = null;
  for (const r of deSelector(selector)) if (!r.media && r.decl[prop]) v = r.decl[prop];
  return v;
};
const NOMBRES_COLOR = { white: "#ffffff", black: "#000000" };
function rgb(valor) {
  const v = NOMBRES_COLOR[String(valor).toLowerCase()] ?? String(valor);
  let m = /^#([0-9a-f]{3})$/i.exec(v);
  if (m) return [...m[1]].map((x) => parseInt(x + x, 16));
  m = /^#([0-9a-f]{6})$/i.exec(v);
  if (m) return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));
  m = /^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i.exec(v);
  if (m) return [m[1], m[2], m[3]].map(Number);
  return null;
}
const luz = ([r, g, b]) => {
  const k = (x) => ((x /= 255) <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
  return 0.2126 * k(r) + 0.7152 * k(g) + 0.0722 * k(b);
};
const contraste = (a, b) => {
  const [x, y] = [luz(a), luz(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
/** Una medida en px (rem/em = 16 px); 0 si es %, vw, auto… */
const aPx = (v) => {
  const m = /^([\d.]+)(px|rem|em)$/.exec(String(v ?? "").trim());
  return m ? Number(m[1]) * (m[2] === "px" ? 1 : 16) : 0;
};
const segundos = (t) => {
  const m = /([\d.]+)(ms|s)\b/.exec(t);
  return m ? Number(m[1]) / (m[2] === "ms" ? 1000 : 1) : 0;
};

// ───────────── los .md: tablas y secciones ─────────────
const leerMd = (f) => {
  if (!existsSync(join(RAIZ, f))) throw conPista(`no encuentro ${f} en la carpeta del proyecto`);
  return leer(f)
    .split("\n")
    .filter((l) => !l.startsWith(">"))
    .join("\n");
};
const celdas = (l) => l.trim().replace(/^\||\|$/g, "").split("|").map((x) => x.trim());
/** La tabla cuya fila de títulos cumple «cumple»: { cab, filas } (las filas, sin las vacías) */
function tablaMd(texto, cumple) {
  const lineas = texto.split("\n");
  const i = lineas.findIndex((l) => l.trim().startsWith("|") && cumple(celdas(l).map(sinTildes)));
  if (i < 0) return null;
  const cab = celdas(lineas[i]).map(sinTildes);
  const filas = [];
  for (const l of lineas.slice(i + 2)) {
    if (!l.trim().startsWith("|")) break;
    const f = celdas(l);
    if (f.slice(1).some(Boolean)) filas.push(f);
  }
  return { cab, filas, col: (p) => cab.findIndex((h) => h.startsWith(p)) };
}
const seccionMd = (texto, titulo) => new RegExp(`^## ${titulo}[^\\n]*\\n([\\s\\S]*?)(?=^## |$(?![\\s\\S]))`, "mi").exec(texto)?.[1].trim() ?? null;
const criterioDe = (t) => /\b(\d\.\d\.\d{1,2})\b/.exec(t ?? "")?.[1] ?? "";
const nivelDe = (t) => (t ?? "").toUpperCase().replace(/[^A]/g, "");
const numero = (t) => {
  const m = /(\d+(?:[.,]\d+)?)/.exec(String(t ?? ""));
  return m ? Number(m[1].replace(",", ".")) : NaN;
};
const SIN_RELLENAR = /⟨|\(escribe/i;

// ───────────── usar las páginas ─────────────
const enviar = (form) => form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
const escribir = (campo, valor) => {
  campo.value = valor;
  campo.dispatchEvent(new Event("input", { bubbles: true }));
  campo.dispatchEvent(new Event("change", { bubbles: true }));
};
const oculto = (el) => !el || el.hidden || el.closest("[hidden]") || el.getAttribute("aria-hidden") === "true" || /visualmente-oculto|sr-only/.test(el.className);
/** El texto de los mensajes que se leen con un campo (los de su aria-describedby que se ven) */
const mensajesDe = (raiz, campo) =>
  (campo.getAttribute("aria-describedby") ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .map((id) => raiz.querySelector(`#${id}`))
    .filter((el) => el && !oculto(el) && espacios(el.textContent))
    .map((el) => espacios(el.textContent));
const textoVisible = (el) => {
  const copia = el.cloneNode(true);
  for (const n of $$(copia, '[aria-hidden="true"], .visualmente-oculto, .sr-only')) n.remove();
  return espacios(copia.textContent);
};

// ───────────── las comprobaciones ─────────────
const resultados = [];
async function comprobar(bloque, id, texto, f) {
  if (SOLO && SOLO !== bloque) return;
  let ok = false;
  let pista = "";
  try {
    const r = await f();
    if (r === true) ok = true;
    else pista = r || "no se cumple";
  } catch (e) {
    pista = e.pista ?? `ha dado un error: ${e.message.split("\n")[0]}`;
  }
  resultados.push({ bloque, id, texto, ok, pista, cuenta: id !== "👀" });
}
const css1 = () => {
  if (errorCss) throw conPista(`el SCSS no compila: ${errorCss}`);
};

// ════════════ Bloque A · Accesibilidad (UD9, RA5 a–d) ════════════
await comprobar("A", "👀", "👀 «Saltar al contenido» es lo primero de cada página y lleva al <main>", async () => {
  for (const k of Object.keys(PAGINAS)) {
    const p = await pintar(k);
    const primero = $(p, "a[href], button, input, select, textarea");
    if (!primero?.classList.contains("saltar")) return `${PAGINAS[k].html}: lo primero que se alcanza con Tab no es «Saltar al contenido»`;
    const destino = $(p, primero.getAttribute("href"));
    if (destino?.tagName !== "MAIN") return `${PAGINAS[k].html}: «Saltar al contenido» no lleva al <main>`;
  }
  return true;
});

// A1 · revision.md
const BARRERAS_A = { "1.1.1": "A", "1.4.3": "AA", "2.1.1": "A", "2.4.7": "AA", "2.4.4": "A", "3.1.1": "A", "3.3.2": "A", "4.1.2": "A", "4.1.3": "AA" };
const TAMBIEN_A = { "1.3.1": "A", "2.4.1": "A", "2.4.6": "AA", "3.3.1": "A", "1.4.11": "AA", "2.5.3": "A", "2.4.11": "AA", "2.4.13": "AAA" };
const PRINCIPIOS = { 1: "perceptible", 2: "operable", 3: "comprensible", 4: "robusto" };
function filasRevision() {
  const t = tablaMd(leerMd("revision.md"), (cab) => cab.some((h) => h.startsWith("criterio")) && cab.some((h) => h.startsWith("principio")));
  if (!t) throw conPista("no encuentro la tabla de revision.md: no cambies la fila de títulos");
  const ix = { n: t.col("n"), barrera: t.col("barrera"), criterio: t.col("criterio"), nivel: t.col("nivel"), principio: t.col("principio") };
  if (Object.values(ix).some((x) => x < 0)) throw conPista("la tabla de revision.md no tiene sus columnas: no cambies la fila de títulos");
  return t.filas
    .filter((f) => f[ix.n] !== "👀")
    .map((f) => ({ n: f[ix.n], barrera: f[ix.barrera] ?? "", criterio: criterioDe(f[ix.criterio]), nivel: nivelDe(f[ix.nivel]), principio: sinTildes(f[ix.principio]) }));
}
await comprobar("A", "A1.1", "✍️ Revisión: al menos 8 barreras de verdad (además del ejemplo), con 7 criterios distintos", () => {
  const filas = filasRevision();
  if (!filas.length) return "la tabla está vacía: recorre las páginas de la agencia con el teclado y mira su código";
  const sin = filas.find((f) => !f.criterio);
  if (sin) return `la fila ${sin.n} no tiene un criterio con número (por ejemplo «1.1.1 Contenido no textual»)`;
  const raro = filas.find((f) => !BARRERAS_A[f.criterio] && !TAMBIEN_A[f.criterio]);
  if (raro) return `la fila ${raro.n} cita el ${raro.criterio}: ¿seguro que esa barrera está en la web de la agencia?`;
  const reales = filas.filter((f) => BARRERAS_A[f.criterio]);
  const distintos = new Set(reales.map((f) => f.criterio)).size;
  if (reales.length < 8) return `llevas ${reales.length} barreras de verdad; faltan ${8 - reales.length}. ¿Has mirado las imágenes, los colores, el teclado, el foco, los enlaces, el idioma, los campos y los mensajes?`;
  if (distintos < 7) return `llevas ${distintos} criterios distintos: hay barreras de más tipos`;
  return true;
});
await comprobar("A", "A1.2", "✍️ Revisión: cada criterio con su nivel (A o AA) y su principio", () => {
  const filas = filasRevision().filter((f) => f.criterio);
  if (!filas.length) return "primero el A1.1";
  const nivel = filas.find((f) => (BARRERAS_A[f.criterio] ?? TAMBIEN_A[f.criterio]) && f.nivel !== (BARRERAS_A[f.criterio] ?? TAMBIEN_A[f.criterio]));
  if (nivel) return `el nivel del ${nivel.criterio} (fila ${nivel.n}) no es «${nivel.nivel || "vacío"}»: míralo en la norma`;
  const pr = filas.find((f) => !f.principio.startsWith(PRINCIPIOS[f.criterio[0]].slice(0, 6)));
  if (pr) return `la fila ${pr.n}: el ${pr.criterio} no es «${pr.principio || "vacío"}». El primer número del criterio dice el principio`;
  return true;
});

// A2 · el acordeón del horario
await comprobar("A", "A2.1", "✍️ El horario: cada servicio se abre con un botón de verdad, que dice qué abre y si está abierto", async () => {
  const p = await pintar("inicio");
  const botones = $$(p, ".horario__boton");
  if (botones.length !== 3) return `encuentro ${botones.length} .horario__boton y hay tres servicios: no les quites la clase`;
  for (const b of botones) {
    if (b.tagName !== "BUTTON") return `«${espacios(b.textContent)}» es un <${b.tagName.toLowerCase()}>: con el teclado no se llega ni se abre (2.1.1)`;
    if (b.getAttribute("type") !== "button") return `al botón «${espacios(b.textContent)}» le falta type="button"`;
    if (!/^h[2-6]$/i.test(b.parentElement?.tagName)) return `el botón «${espacios(b.textContent)}» va dentro de su título (<h3>): así el lector lo encuentra en la lista de títulos`;
    if (b.getAttribute("aria-expanded") !== "false") return `«${espacios(b.textContent)}» no dice que está cerrado: aria-expanded="false" al empezar (4.1.2)`;
    const panel = p.querySelector(`#${b.getAttribute("aria-controls") || "nada"}`);
    if (!panel) return `«${espacios(b.textContent)}» no dice qué abre: aria-controls con el id de su panel`;
    if (!panel.hidden) return `el panel de «${espacios(b.textContent)}» se ve al empezar: el atributo hidden`;
  }
  return true;
});
await comprobar("A", "A2.2", "✍️ El horario: al pulsar se abre, y lo dice; al volver a pulsar se cierra", async () => {
  const p = await pintar("inicio");
  const [b, otro] = $$(p, ".horario__boton");
  if (!b) return "no encuentro los .horario__boton";
  const panel = p.querySelector(`#${b.getAttribute("aria-controls") || "nada"}`);
  if (!panel) return "primero el A2.1 (aria-controls)";
  b.click();
  if (panel.hidden) return "al pulsar, el panel no se abre (quítale el hidden)";
  if (b.getAttribute("aria-expanded") !== "true") return "al pulsar se abre, pero el botón no lo dice: aria-expanded=\"true\"";
  if (otro && otro.getAttribute("aria-expanded") !== "false") return "al abrir uno, el otro también cambia: cada botón, el suyo";
  b.click();
  if (!panel.hidden || b.getAttribute("aria-expanded") !== "false") return "al volver a pulsar no se cierra (o no dice que está cerrado)";
  return true;
});

// A3 · Mi cita
await comprobar("A", "A3.1", "✍️ Mi cita: el campo tiene su etiqueta y el error se oye, se marca y devuelve el foco", async () => {
  const p = await pintar("mi-cita");
  const campo = $(p, "#codigo");
  if (!campo) return "no encuentro el campo #codigo: no le cambies el id";
  const etiqueta = $(p, 'label[for="codigo"]');
  if (!etiqueta || oculto(etiqueta) || !espacios(etiqueta.textContent)) return "el campo del código solo tiene placeholder: un <label for=\"codigo\"> que se vea (3.3.2)";
  const form = campo.closest("form");
  escribir(campo, "ZZ9");
  enviar(form);
  const mensajes = mensajesDe(p, campo);
  const alerta = $$(form, '[role="alert"], [role="status"], [aria-live="assertive"], [aria-live="polite"]').find((el) => espacios(el.textContent));
  if (!alerta) return "con un código que no existe, el error no está en una región que se lee sola (role=\"alert\" o role=\"status\"): quien no ve no se entera (4.1.3)";
  if (!/codigo/.test(sinTildes(alerta.textContent))) return `el error dice «${espacios(alerta.textContent)}»: que diga qué pasa con el código`;
  if (campo.getAttribute("aria-invalid") !== "true") return "el campo no queda marcado como erróneo: aria-invalid=\"true\"";
  if (!mensajes.some((m) => m === espacios(alerta.textContent))) return "el error no está unido al campo: su id, en el aria-describedby del campo";
  if (document.activeElement !== campo) return "después del error, el foco no vuelve al campo para corregirlo";
  return true;
});
await comprobar("A", "A3.2", "✍️ Mi cita: con el código bueno sale la cita, y el error se va", async () => {
  const p = await pintar("mi-cita");
  const campo = $(p, "#codigo");
  if (!campo) return "no encuentro el campo #codigo";
  escribir(campo, "nada");
  enviar(campo.closest("form"));
  if (campo.getAttribute("aria-invalid") !== "true") return "primero el A3.1: con un código que no existe, el campo queda marcado (aria-invalid)";
  escribir(campo, "k7q2m9");
  enviar(campo.closest("form"));
  const cita = $(p, ".cita");
  if (!cita || cita.hidden) return "con el código K7Q2M9 (en minúsculas también) no sale la cita";
  if (!/10:20/.test(cita.textContent)) return "sale la cita, pero no dice su hora";
  if (campo.getAttribute("aria-invalid") === "true") return "la cita sale, pero el campo sigue marcado como erróneo (quita el aria-invalid)";
  if ($$(campo.closest("form"), '[role="alert"], [role="status"], [aria-live]').some((el) => espacios(el.textContent))) return "la cita sale, pero el error de antes sigue ahí";
  return true;
});

// A4 · perceptible y comprensible
await comprobar("A", "A4.1", "✍️ El mapa dice lo que se ve, y las cuatro páginas dicen su idioma", async () => {
  const p = await pintar("inicio");
  const mapa = $(p, ".llegar__mapa");
  if (!mapa) return "no encuentro el mapa (.llegar__mapa)";
  const alt = mapa.getAttribute("alt");
  if (alt === null) return "el mapa no tiene alt: el lector dice «mapa.png» (1.1.1)";
  if (!alt.trim()) return "alt=\"\" es para lo que es adorno, y el mapa dice dónde está el consultorio";
  if (/\.(png|jpe?g|webp|svg)|^imagen|^mapa$|^foto/i.test(alt.trim()) || alt.trim().split(/\s+/).length < 5) return `alt="${alt}": que diga lo que ve quien mira el mapa (dónde está y cómo se llega)`;
  for (const pg of Object.values(PAGINAS)) {
    const lang = /<html[^>]*\blang="([^"]*)"/i.exec(leer(pg.html))?.[1] ?? "";
    if (!/^es\b/.test(lang)) return `${pg.html} no dice su idioma (lang="es"): el lector la lee con otra voz (3.1.1)`;
  }
  return true;
});
await comprobar("A", "A4.2", "✍️ Ningún enlace dice «pulse aquí»: cada uno dice adónde lleva", async () => {
  for (const k of Object.keys(PAGINAS)) {
    const p = await pintar(k);
    for (const a of $$(p, "a[href]")) {
      const t = sinTildes(a.getAttribute("aria-label") || textoVisible(a));
      if (/^(pulse|pulsa|haga clic|haz clic|clic|click|pinche|pincha)?\s*(aqui|aca)\.?$|^(mas|leer mas|ver mas|enlace)$/.test(t)) return `${PAGINAS[k].html}: un enlace dice «${espacios(a.textContent)}»; en la lista de enlaces del lector no se sabe adónde lleva (2.4.4)`;
    }
  }
  return true;
});
await comprobar("A", "A4.3", "✍️ Contraste: todo el texto llega a 4,5:1, con los tokens", () => {
  css1();
  const blanco = [255, 255, 255];
  for (const r of reglas) {
    if (r.media || /:hover|:focus|:active|::placeholder|::after|::before/.test(r.sel) || !r.decl.color) continue;
    const delante = rgb(r.decl.color);
    if (!delante) continue;
    // el fondo: el suyo, o el de su bloque BEM (.cabecera__marca está sobre .cabecera), o el blanco de la página
    const bloque = /^\.([a-z0-9-]+)(?:__|--)/.exec(r.sel)?.[1];
    const fondo = r.decl.background ?? r.decl["background-color"] ?? (bloque && (propiedad(`.${bloque}`, "background") ?? propiedad(`.${bloque}`, "background-color"))) ?? "";
    const detras = rgb(fondo) ?? blanco;
    const k = contraste(delante, detras);
    if (k < 4.5) return `${r.sel} { color: ${r.decl.color} } sobre ${detras === blanco ? "blanco" : fondo}: ${k.toFixed(1).replace(".", ",")}:1, y hacen falta 4,5:1 (1.4.3). Cámbialo en el token`;
  }
  return true;
});
await comprobar("A", "A4.4", "✍️ Se ve dónde está el foco (sin outline: none, o con un :focus-visible que se vea)", () => {
  css1();
  const quita = reglas.find((r) => !r.media && /^(none|0)\b/.test(r.decl.outline ?? "") && !/:focus:not\(:focus-visible\)|:not\(:focus-visible\)/.test(r.sel));
  const pone = reglas.some((r) => /:focus-visible/.test(r.sel) && !/:not\(:focus-visible\)/.test(r.sel) && ((r.decl.outline && !/^(none|0)\b/.test(r.decl.outline)) || r.decl["box-shadow"]));
  if (quita && !pone) return `${quita.sel} { outline: ${quita.decl.outline} }: con el teclado no se ve dónde está el foco (2.4.7). Pon un :focus-visible con un outline que se vea`;
  if (quita && /^\*$|^:focus$|^\*:focus$/.test(quita.sel)) return `${quita.sel} { outline: none } sigue quitando el foco: quítalo (el :focus-visible no gana a todo)`;
  if (!pone && !quita) return true;
  if (pone) {
    const r = reglas.find((x) => /:focus-visible/.test(x.sel) && x.decl.outline);
    const col = rgb(/#[0-9a-f]{3,6}|rgba?\([^)]*\)/i.exec(r?.decl.outline ?? "")?.[0] ?? "");
    if (col && contraste(col, [255, 255, 255]) < 3) return `el outline del foco (${r.decl.outline}) apenas se ve sobre blanco: 3:1 como mínimo`;
  }
  return true;
});
await comprobar("A", "A4.5", "✍️ axe: las cuatro páginas, sin ningún fallo de WCAG 2.2 A y AA", async () => {
  for (const k of Object.keys(PAGINAS)) {
    await pintar(k);
    const v = (await axe(document)).violations;
    if (v.length) return `${PAGINAS[k].html}: ${listaAxe(v)} (npm run auditar ${k} te dice dónde)`;
  }
  return true;
});

// ════════════ Bloque B · Auditoría (UD10, RA5 e–g) ════════════
await comprobar("B", "👀", "👀 El test externo (npm run auditar) abre las cuatro páginas", async () => {
  for (const k of Object.keys(PAGINAS)) await pintar(k);
  return true;
});
const TIPOS_B = [
  { k: "ancho", nombre: "la tabla a 320 px", ok: (f) => f.criterio === "1.4.10", nivel: "AA", tec: /320|400 ?%|zoom|viewport|modo dispositivo|movil|estrech/ },
  { k: "color", nombre: "los turnos cerrados solo con color", ok: (f) => f.criterio === "1.4.1", nivel: "A", tec: /forced|colores forzados|alto contraste|contrast|daltoni|escala de grises|lector/ },
  { k: "boton", nombre: "los botones sin borde con colores forzados", ok: (f) => f.criterio === "1.4.11", nivel: "AA", tec: /forced|colores forzados|alto contraste/ },
  { k: "movimiento", nombre: "el latido de urgencias", ok: (f) => f.criterio === "2.2.2" || f.criterio === "2.3.3", nivel: null, tec: /reduced|reducir movimiento|movimiento reducido|animac/ },
  { k: "pdf", nombre: "el folleto de la vacuna (PDF)", ok: (f) => /folleto|pdf|vacuna/.test(sinTildes(f.barrera)) && ["1.1.1", "1.3.1", "1.4.5", "4.1.2"].includes(f.criterio), nivel: null, tec: /pdf|lector|seleccion|abrir|abriendo|copiar|folleto/ },
];
const NIVELES = { "1.4.10": "AA", "1.4.1": "A", "1.4.11": "AA", "2.2.2": "A", "2.3.3": "AAA", "1.1.1": "A", "1.3.1": "A", "1.4.5": "AA", "4.1.2": "A" };
const HERRAMIENTA = /auditar|lighthouse|\baxe\b|wave|devtools/i;
function filasInforme() {
  const t = tablaMd(leerMd("informe.md"), (cab) => cab.some((h) => h.startsWith("criterio")) && cab.some((h) => h.startsWith("como")));
  if (!t) throw conPista("no encuentro la tabla de informe.md: no cambies la fila de títulos");
  const ix = { n: t.col("n"), barrera: t.col("barrera"), como: t.col("como"), criterio: t.col("criterio"), nivel: t.col("nivel"), estado: t.col("estado") };
  if (Object.values(ix).some((x) => x < 0)) throw conPista("la tabla de informe.md no tiene sus columnas");
  return t.filas
    .filter((f) => f[ix.n] !== "👀")
    .map((f) => {
      const fila = { n: f[ix.n], barrera: f[ix.barrera] ?? "", como: f[ix.como] ?? "", criterio: criterioDe(f[ix.criterio]), nivel: nivelDe(f[ix.nivel]), estado: sinTildes(f[ix.estado]) };
      fila.tipo = TIPOS_B.find((x) => x.ok(fila));
      return fila;
    });
}
await comprobar("B", "B1.1", "✍️ Informe: las 5 barreras que la revisión no vio, cada una con su criterio", () => {
  const filas = filasInforme();
  if (!filas.length) return "la tabla está vacía: lo que encuentras con otras tecnologías (320 px, colores forzados, movimiento reducido) y en el folleto";
  const sin = filas.find((f) => !f.criterio);
  if (sin) return `la fila ${sin.n} no tiene un criterio con número`;
  const tipos = new Set(filas.filter((f) => f.tipo).map((f) => f.tipo.k));
  const falta = TIPOS_B.filter((x) => !tipos.has(x.k));
  if (falta.length) return `llevas ${tipos.size} de las 5; ${falta.length === 1 ? "falta una" : `faltan ${falta.length}`}. ${falta[0].k === "pdf" ? "¿Has abierto el folleto de la vacuna?" : "Prueba a 320 px, con colores forzados y con «reducir movimiento» (F12 → Rendering)"}`;
  return true;
});
await comprobar("B", "B1.2", "✍️ Informe: cada una con su nivel, y cómo la encontraste (lo que ninguna máquina ve, RA5.g)", () => {
  const filas = filasInforme().filter((f) => f.tipo);
  if (!filas.length) return "primero el B1.1";
  const nivel = filas.find((f) => NIVELES[f.criterio] && f.nivel !== NIVELES[f.criterio]);
  if (nivel) return `el nivel del ${nivel.criterio} (fila ${nivel.n}) no es «${nivel.nivel || "vacío"}»`;
  const vacia = filas.find((f) => !f.como);
  if (vacia) return `la fila ${vacia.n} no dice cómo la has encontrado`;
  const soloMaquina = filas.find((f) => !f.tipo.tec.test(sinTildes(f.como)));
  if (soloMaquina) return `la fila ${soloMaquina.n} (${soloMaquina.tipo.nombre}) dice «${soloMaquina.como}»: ¿con qué tecnología la viste? axe no ve esa barrera`;
  return true;
});
await comprobar("B", "B1.3", "✍️ Informe: el alcance, con las páginas, las herramientas y los navegadores", () => {
  const t = leerMd("informe.md");
  const linea = (k) => new RegExp(`^- \\*\\*${k}:\\*\\*\\s*(.*)$`, "mi").exec(t)?.[1]?.trim() ?? "";
  const vacia = (v) => !v || SIN_RELLENAR.test(v);
  const paginas = sinTildes(linea("Páginas revisadas"));
  if (vacia(paginas)) return "falta «Páginas revisadas»: la muestra, qué páginas has auditado";
  const cuantas = [/inicio/, /pedir cita|\bcita\b/, /mi cita/, /accesibilidad|declaracion/].filter((re) => re.test(paginas)).length;
  if (cuantas < 4) return `en «Páginas revisadas» hay ${cuantas} de las 4 páginas: la web es pequeña, entran todas`;
  if (vacia(linea("Herramientas")) || !HERRAMIENTA.test(linea("Herramientas"))) return "falta «Herramientas»: cuáles has usado (npm run auditar, Lighthouse…)";
  const nav = linea("Navegadores y tecnologías");
  if (vacia(nav) || !/chrome|firefox|edge|safari/i.test(nav)) return "en «Navegadores y tecnologías» falta algún navegador";
  return true;
});
// B2 · los arreglos
const ZONAS = /horario|portada|llegar|urgencias|cita|buscar|aviso|contenido|campo|huecos/;
await comprobar("B", "B2.1", "✍️ A 320 px (o con zoom al 400 %) no hay que moverse de lado (1.4.10)", () => {
  css1();
  const caja = /auto|scroll/.test(propiedad(".horario__caja", "overflow-x") ?? propiedad(".horario__caja", "overflow") ?? "");
  for (const r of reglas.filter((x) => !x.media && ZONAS.test(x.sel))) {
    for (const prop of ["width", "min-width"]) {
      if (aPx(r.decl[prop]) <= 320) continue;
      if (/horario__tabla/.test(r.sel) && caja) continue;
      return `${r.sel} { ${prop}: ${r.decl[prop]} }: a 320 px no cabe y sale la barra de desplazamiento de toda la página. ¿width: 100%, o una caja que se desplace ella sola?`;
    }
    if (r.decl["white-space"] === "nowrap" && !/horario__tabla|boton/.test(r.sel)) return `${r.sel} { white-space: nowrap }: el texto no se parte y a 320 px se sale`;
  }
  if (!/100%/.test(propiedad("img", "max-width") ?? "")) return "las imágenes, con max-width: 100% (está en _base.scss: no lo quites)";
  return true;
});
await comprobar("B", "B2.2", "✍️ Los turnos cerrados se dicen con texto, no solo con el color de la celda (1.4.1)", async () => {
  const p = await pintar("inicio");
  const celdas = $$(p, ".horario__celda--cerrado");
  if (celdas.length < 6) return "no encuentro las celdas .horario__celda--cerrado: no les quites la clase";
  const vacia = celdas.find((td) => !/cerrad/.test(sinTildes(textoVisible(td))));
  if (vacia) return "hay turnos cerrados que son solo una celda de color: con colores forzados desaparecen y el lector dice «celda vacía»";
  return true;
});
await comprobar("B", "B2.3", "✍️ Con colores forzados, los botones se siguen viendo: tienen borde", () => {
  css1();
  const borde = propiedad(".boton", "border") ?? "";
  const ancho = propiedad(".boton", "border-width") ?? "";
  const forzado = reglas.some((r) => /forced-colors:\s*active/.test(r.media) && /\.boton/.test(r.sel) && (r.decl.border || r.decl["border-color"] || r.decl.outline));
  const tiene = (borde && !/^(none|0)\b/.test(borde)) || (ancho && aPx(ancho) > 0);
  if (!tiene && !forzado) return `.boton { border: ${borde || "?"} }: con colores forzados el fondo desaparece y el botón parece texto suelto. Un borde (puede ser transparent) lo mantiene`;
  return true;
});
await comprobar("B", "B2.4", "✍️ El latido de urgencias no se mueve sin parar, y respeta «reducir movimiento» (2.2.2)", () => {
  css1();
  const anim = reglas.filter((r) => /urgencias/.test(r.sel) && (r.decl.animation || r.decl["animation-name"]) && !/none/.test(r.decl.animation ?? r.decl["animation-name"]));
  if (!anim.length) return true;
  for (const r of anim) {
    const a = `${r.decl.animation ?? ""} ${r.decl["animation-duration"] ?? ""} ${r.decl["animation-iteration-count"] ?? ""}`;
    if (/infinite/.test(a)) return `${r.sel} late sin parar (infinite): 2.2.2 pide poder pararlo, o que dure 5 s como mucho`;
    const veces = Number(/(?:^|\s)(\d+)(?=\s|$)/.exec(`${r.decl.animation ?? ""} ${r.decl["animation-iteration-count"] ?? ""}`.replace(/[\d.]+m?s\b/g, ""))?.[1] ?? 1);
    if (segundos(a) * veces > 5) return `${r.sel} se mueve ${segundos(a) * veces} s: más de 5 s sin poder pararlo`;
    const protegida = /prefers-reduced-motion:\s*no-preference/.test(r.media);
    const anulada = reglas.some((x) => /prefers-reduced-motion:\s*reduce/.test(x.media) && /urgencias/.test(x.sel) && /none/.test(x.decl.animation ?? x.decl["animation-name"] ?? ""));
    if (!protegida && !anulada) return "quien tiene activado «reducir movimiento» lo sigue viendo latir: usa @media (prefers-reduced-motion: …)";
  }
  return true;
});
// B3 · la declaración
const DECLARACION = () => leerMd("declaracion.md");
const situacion = (texto) => /situacion de cumplimiento:\s*\**\s*(no conforme|parcialmente conforme|plenamente conforme)/.exec(sinTildes(texto))?.[1] ?? "";
// B3.1 se comprueba al final, cuando se sabe qué queda
await comprobar("B", "B3.2", "✍️ Declaración: el contenido no accesible, con su criterio y una fecha", () => {
  const s = seccionMd(DECLARACION(), "Contenido no accesible");
  if (s === null) return "no encuentro «## Contenido no accesible»: no cambies los títulos";
  if (!s || SIN_RELLENAR.test(s)) return "rellena «Contenido no accesible»: lo que queda sin arreglar, su criterio y cuándo estará";
  if (/^-?\s*ningun/.test(sinTildes(s))) return "dices que no queda nada… ¿y el folleto de la vacuna? Ábrelo y prueba a seleccionar el texto";
  if (!/folleto|pdf|vacuna/.test(sinTildes(s)) || !/\b(1\.1\.1|1\.3\.1|1\.4\.5)\b/.test(s)) return "lo que queda es el folleto en PDF: di qué es y su criterio";
  if (!/\b\d{1,2}\/\d{1,2}\/\d{4}\b|\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/i.test(s)) return "falta CUÁNDO estará arreglado: una fecha";
  const ya = ["1.4.10", "1.4.1", "1.4.11", "2.2.2", "1.4.3", "2.4.4", "2.4.7", "2.1.1", "3.1.1", "3.3.2", "4.1.3"].find((k) => new RegExp(`\\b${k.replace(/\./g, "\\.")}\\b`).test(s));
  if (ya) return `cita el ${ya}, que ya has arreglado: aquí solo va lo que NO cumple`;
  return true;
});
await comprobar("B", "B3.3", "✍️ Declaración: a qué se aplica, cuándo y cómo se preparó, el contacto y la reclamación", () => {
  const d = DECLARACION();
  const ambito = /se aplica a:\s*([^\n]+(?:\n(?!\n|#)[^\n]+)*)/i.exec(d)?.[1] ?? "";
  if (!ambito || SIN_RELLENAR.test(ambito)) return "rellena «Esta declaración de accesibilidad se aplica a: …»";
  if (!/inicio/i.test(ambito) || !/cita/i.test(ambito)) return "en «se aplica a» faltan páginas: las de tu informe";
  const prep = seccionMd(d, "Preparación de la presente declaración");
  if (prep === null) return "no encuentro «## Preparación de la presente declaración»";
  const f = /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/.exec(prep);
  if (!f || Number(f[2]) > 12 || Number(f[1]) > 31 || Number(f[1]) < 1) return "la fecha de la preparación, como dd/mm/aaaa";
  if (!/autoevaluac|auditor|evaluad|revisad|probad/i.test(prep)) return "el método: ¿autoevaluación del consultorio o una empresa de fuera? Y con qué";
  const cont = seccionMd(d, "Observaciones y datos de contacto");
  const recl = seccionMd(d, "Procedimiento de reclamación");
  if (cont === null || recl === null) return "no encuentro «## Observaciones y datos de contacto» o «## Procedimiento de reclamación»";
  if (!/[\w.-]+@[\w-]+\.[\w.]+|\b\d{3} ?\d{3} ?\d{3}\b|https?:\/\//.test(cont)) return "falta un correo, un teléfono o un formulario: ¿cómo avisa un paciente de que algo no puede usarlo?";
  if (!recl || SIN_RELLENAR.test(recl) || !/reclam/i.test(recl)) return "di adónde se reclama si la respuesta no convence";
  return true;
});

// ════════════ Bloque C · Usabilidad (UD11, RA6 a–c) ════════════
const datosHuecos = await cargar("src/datos/huecos.js");
await comprobar("C", "👀", "👀 Los huecos de la semana (src/datos/huecos.js), sin tocar", () => {
  const h = datosHuecos.m?.HUECOS;
  if (!Array.isArray(h) || h.length !== 7 || h.filter((x) => x.libre).length !== 4) return "src/datos/huecos.js no es el del kit: no lo cambies (son los datos del servidor)";
  return true;
});
const PROBLEMAS_C = [
  { k: "confirmacion", re: /confirmac|solicitud registrada|88231|\bref\b/, h: [1, 9], ejemplo: true },
  { k: "borrar", re: /borrar|vaciar|reset|limpiar/, h: [3, 5], g: [1, 3] },
  { k: "tarjeta", re: /tarjeta|sanitaria|\bcip\b/, h: [2, 3, 5, 7, 8], g: [3, 4] },
  { k: "jerga", re: /jerga|\bmap\b|\benf\b|demanda|programada|sigla|abreviatura|motivo/, h: [2, 4], g: [2, 4] },
  { k: "tipos", re: /teclado|type=|\btel\b|autocomplet|autorrellen|campo de texto|campos de texto/, h: [4, 7], g: [1, 3] },
  { k: "errores", re: /error|formato incorrecto|campo 3/, h: [9, 5], g: [2, 4] },
  { k: "huecos", re: /hueco|a ciegas|libres?\b|disponib|fecha y la hora|fecha y hora/, h: [6, 5, 7], g: [3, 4] },
];
function filasEvaluacion() {
  const t = tablaMd(leerMd("evaluacion.md"), (cab) => cab.some((h) => h.startsWith("heuristica")) && cab.some((h) => h.startsWith("gravedad")));
  if (!t) throw conPista("no encuentro la tabla de evaluacion.md: no cambies la fila de títulos");
  const ix = { n: t.col("n"), problema: t.col("problema"), heuristica: t.col("heuristica"), gravedad: t.col("gravedad"), cambio: t.col("cambio") };
  if (Object.values(ix).some((x) => x < 0)) throw conPista("la tabla de evaluacion.md no tiene sus columnas");
  return t.filas
    .filter((f) => f[ix.n] !== "👀")
    .map((f) => ({
      n: f[ix.n],
      problema: f[ix.problema] ?? "",
      tipo: PROBLEMAS_C.find((p) => !p.ejemplo && p.re.test(sinTildes(f[ix.problema]))),
      heuristica: numero(f[ix.heuristica]),
      heuristicaTexto: f[ix.heuristica] ?? "",
      gravedad: /^\s*[0-4]\s*$/.test(f[ix.gravedad] ?? "") ? Number(f[ix.gravedad]) : NaN,
      cambio: f[ix.cambio] ?? "",
    }));
}
await comprobar("C", "C1.1", "✍️ Evaluación: el objetivo y al menos 2 tipos de paciente (RA6.b)", () => {
  const t = leerMd("evaluacion.md");
  const obj = seccionMd(t, "Objetivo");
  const usu = seccionMd(t, "Usuarios");
  if (obj === null || usu === null) return "no encuentro «## Objetivo» o «## Usuarios»: no cambies los títulos";
  if (!obj || SIN_RELLENAR.test(obj) || obj.split(/\s+/).length < 6) return "escribe el objetivo de la página en una frase: quién tiene que poder hacer qué";
  const tipos = usu.split("\n").filter((l) => /^\s*-\s+\S/.test(l) && !SIN_RELLENAR.test(l));
  if (tipos.length < 2) return `hay ${tipos.length} tipo(s) de paciente: al menos dos, cada uno en una línea «- …» (¿quién pide cita en el barrio?)`;
  return true;
});
await comprobar("C", "C1.2", "✍️ Evaluación: al menos 5 problemas distintos, con su heurística y el cambio que propones", () => {
  const filas = filasEvaluacion();
  if (!filas.length) return "la tabla está vacía: pide una cita en la página de la agencia como lo haría un paciente, y apunta lo que te frena";
  const tipos = new Set(filas.filter((f) => f.tipo).map((f) => f.tipo.k));
  if (tipos.size < 5) return `llevas ${tipos.size} problema(s) distintos; faltan ${5 - tipos.size}. Mira cada campo, cada mensaje y cada botón`;
  for (const f of filas.filter((x) => x.tipo)) {
    if (!(f.heuristica >= 1 && f.heuristica <= 10)) return `la fila ${f.n} no tiene la heurística con su número (1 a 10) y su nombre`;
    if (!f.tipo.h.includes(f.heuristica)) return `la fila ${f.n} («${f.problema.slice(0, 40)}…»): la heurística ${f.heuristica} no es la que mejor lo explica. Vuelve a leer las diez`;
    if (espacios(f.cambio).split(" ").length < 3) return `la fila ${f.n} no dice qué cambio propones`;
  }
  return true;
});
await comprobar("C", "C1.3", "✍️ Evaluación: la gravedad, con sentido (lo que impide pedir la cita, un 3 o un 4; no todo igual)", () => {
  const filas = filasEvaluacion().filter((f) => f.tipo);
  if (!filas.length) return "primero el C1.2";
  const sin = filas.find((f) => Number.isNaN(f.gravedad));
  if (sin) return `la fila ${sin.n} no tiene una gravedad de 0 a 4`;
  if (new Set(filas.map((f) => f.gravedad)).size === 1) return `todas tienen gravedad ${filas[0].gravedad}: entonces no sirve para decidir qué arreglar primero`;
  const mal = filas.find((f) => f.tipo.g && (f.gravedad < f.tipo.g[0] || f.gravedad > f.tipo.g[1]));
  if (mal) return `la fila ${mal.n}, gravedad ${mal.gravedad}: ${mal.gravedad < mal.tipo.g[0] ? "¿no impide (o casi) pedir la cita?" : "¿de verdad impide pedir la cita?"} Piensa en la frecuencia, el impacto y si se repite`;
  return true;
});
// C2 · el rediseño de Pedir cita
const RELLENO = { nombre: "Remedios Gil Ruiz", dni: "12345678Z", nacimiento: "1947-03-15", telefono: "600123123" };
function rellenar(form) {
  for (const [k, v] of Object.entries(RELLENO)) if (form.elements[k]) escribir(form.elements[k], v);
  const motivo = form.elements.motivo;
  if (motivo?.tagName === "SELECT") {
    const op = [...motivo.options].find((o) => o.value);
    if (op) escribir(motivo, op.value);
  }
}
await comprobar("C", "C2.1", "✍️ Pedir cita: la tarjeta sanitaria no es obligatoria, y el motivo, con sus palabras", async () => {
  const p = await pintar("cita");
  const form = $(p, "form");
  if (!form) return "no encuentro el formulario de Pedir cita";
  const tarjeta = form.elements.tarjeta;
  if (tarjeta?.required) return "la tarjeta sanitaria sigue siendo obligatoria: quien no la lleva encima no puede pedir cita (Remedios se rindió)";
  const motivo = form.elements.motivo;
  if (!motivo) return "no encuentro el motivo (name=\"motivo\"): no le cambies el nombre";
  const textos = motivo.tagName === "SELECT" ? [...motivo.options].filter((o) => o.value).map((o) => espacios(o.textContent)) : $$(form, 'input[name="motivo"]').map((i) => espacios(i.closest("label")?.textContent ?? i.labels?.[0]?.textContent));
  if (textos.length < 3) return "el motivo tiene menos de tres opciones";
  const jerga = textos.find((t) => /\b(MAP|ENF|Adm|demanda|programada|PAC|AP)\b/.test(t));
  if (jerga) return `el motivo dice «${jerga}»: así lo dice el centro, no el paciente (Julián tuvo que preguntar)`;
  const corta = textos.find((t) => t.split(/\s+/).length < 2);
  if (corta) return `«${corta}» se queda corto: que se entienda para qué es`;
  return true;
});
await comprobar("C", "C2.2", "✍️ Los huecos libres, a la vista, para elegir uno (reconocer antes que recordar)", async () => {
  const mod = await cargar("src/paginas/cita.js");
  if (mod.error) return `no se puede cargar src/paginas/cita.js (${mod.error})`;
  if (typeof mod.m.Huecos !== "function") return "src/paginas/cita.js no exporta la función Huecos()";
  const HUECOS = datosHuecos.m?.HUECOS ?? [];
  const caja = document.createElement("div");
  caja.innerHTML = mod.m.Huecos(HUECOS);
  const radios = $$(caja, 'input[type="radio"]');
  const libres = HUECOS.filter((h) => h.libre);
  if (radios.length !== libres.length) return `Huecos() pinta ${radios.length} opción(es) y hay ${libres.length} huecos libres: un botón de radio por cada hueco LIBRE`;
  if (new Set(radios.map((r) => r.name)).size !== 1) return "los botones de radio de los huecos, todos con el mismo name (así solo se elige uno)";
  for (const [i, r] of radios.entries()) {
    const t = espacios(r.closest("label")?.textContent ?? caja.querySelector(`label[for="${r.id}"]`)?.textContent);
    if (!t.includes(libres[i].hora) || !sinTildes(t).includes(sinTildes(libres[i].dia).split(" ")[0])) return `la opción ${i + 1} dice «${t}»: tiene que decir el día y la hora (y con quién), y en su <label>`;
  }
  caja.innerHTML = mod.m.Huecos(HUECOS.map((h) => ({ ...h, libre: false })));
  if ($$(caja, 'input[type="radio"]').length || !espacios(caja.textContent)) return "si no queda ningún hueco libre, Huecos() tiene que decirlo (y no pintar opciones)";
  const p = await pintar("cita");
  const grupo = $(p, ".huecos");
  if (grupo?.tagName !== "FIELDSET" || !espacios($(grupo, "legend")?.textContent)) return "los huecos van dentro de un <fieldset class=\"huecos\"> con su <legend>";
  if ($$(grupo, 'input[type="radio"]').length !== libres.length) return "en la página no salen los huecos libres: ¿activarCita() llama a Huecos()?";
  const aMano = $$(p, 'input[type="time"], input[name="fecha"], input[name="hora"]');
  if (aMano.length) return "siguen los campos para escribir la fecha y la hora a mano: fuera (se elige un hueco)";
  return true;
});
await comprobar("C", "C2.3", "✍️ Los errores dicen qué pasa y cómo arreglarlo, con un ejemplo, junto a su campo", async () => {
  const p = await pintar("cita");
  const form = $(p, "form");
  if (!form) return "no encuentro el formulario";
  if (!form.noValidate) return "el formulario sin novalidate: los mensajes del navegador no dicen cómo arreglarlo (y cada uno sale distinto)";
  enviar(form);
  for (const k of ["nombre", "dni", "telefono"]) {
    const campo = form.elements[k];
    if (!campo) return `no encuentro el campo ${k}: no le cambies el name`;
    const m = mensajesDe(p, campo).filter((x) => !/^(con la letra|te mandamos)/i.test(x));
    if (!m.length) return `al enviar vacío, el campo ${k} no tiene ningún mensaje unido (aria-describedby) que se vea`;
    if (!m.some((x) => /por ejemplo|p\. ?ej|\bej\.|como \d/i.test(x))) return `el mensaje de ${k} («${m[0]}») no dice cómo arreglarlo con un ejemplo`;
    if (campo.getAttribute("aria-invalid") !== "true") return `el campo ${k} no queda marcado como erróneo (aria-invalid="true")`;
  }
  if (document.activeElement !== form.elements.nombre) return "al enviar con errores, el foco no va al primer campo que falla";
  const vacio = mensajesDe(p, form.elements.dni).join(" ");
  escribir(form.elements.dni, "1234");
  enviar(form);
  const mal = mensajesDe(p, form.elements.dni).join(" ");
  if (mal === vacio) return "el DNI vacío y el DNI mal escrito dicen lo mismo: cada fallo, su mensaje (validity.valueMissing, patternMismatch…)";
  if (/error en el campo|formato incorrecto|dato no valido|campo \d/.test(sinTildes(mal))) return `el error del DNI dice «${mal}»: no dice qué está mal ni cómo arreglarlo`;
  return true;
});
await comprobar("C", "C2.4", "✍️ Al pedirla, la página dice qué ha pasado: el día, la hora y con quién", async () => {
  const p = await pintar("cita");
  const form = $(p, "form");
  if (!form) return "no encuentro el formulario";
  rellenar(form);
  const radio = $(form, 'input[type="radio"][name]');
  if (!radio) return "primero el C2.2 (los huecos)";
  radio.click();
  radio.checked = true;
  radio.dispatchEvent(new Event("change", { bubbles: true }));
  enviar(form);
  const estado = $$(p, '[role="status"], [aria-live="polite"], output').find((el) => espacios(el.textContent));
  if (!estado) return "con todo bien relleno, no sale nada en un role=\"status\": quien no ve no sabe si se ha pedido";
  const t = sinTildes(estado.textContent);
  const h = (datosHuecos.m?.HUECOS ?? []).find((x) => x.libre);
  if (/solicitud registrada|ref\.? ?\d+/.test(t)) return `la confirmación dice «${espacios(estado.textContent)}»: ¿para qué día? ¿con quién? (Aya no lo sabía)`;
  if (!t.includes(sinTildes(h.dia).split(" ")[0]) || !t.includes(h.hora) || !t.includes(sinTildes(h.profesional).split(" ").pop())) return `la confirmación dice «${espacios(estado.textContent)}»: que diga el día, la hora y con quién`;
  return true;
});
await comprobar("C", "C3.1", "✍️ Los estándares: el tipo y el autocompletado del nombre, la fecha de nacimiento y el móvil", async () => {
  const form = $(await pintar("cita"), "form");
  if (!form) return "no encuentro el formulario";
  const e = form.elements;
  if (e.nombre?.getAttribute("autocomplete") !== "name") return "al nombre le falta autocomplete=\"name\": el navegador ya lo sabe";
  if (e.telefono?.getAttribute("type") !== "tel") return "el móvil, con type=\"tel\": en el móvil sale el teclado de números";
  if (!/^tel(-national)?$/.test(e.telefono?.getAttribute("autocomplete") ?? "")) return "al móvil le falta autocomplete=\"tel\"";
  if (e.nacimiento?.getAttribute("type") !== "date") return "la fecha de nacimiento, con type=\"date\"";
  if (e.nacimiento?.getAttribute("autocomplete") !== "bday") return "a la fecha de nacimiento le falta autocomplete=\"bday\"";
  return true;
});
await comprobar("C", "C3.2", "✍️ Los botones: sin «Borrar», y el principal dice lo que hace", async () => {
  const p = await pintar("cita");
  const form = $(p, "form");
  const botones = $$(form, "button, input[type=submit], input[type=reset]");
  const borrar = botones.find((b) => b.type === "reset" || /borrar|limpiar|vaciar/.test(sinTildes(b.textContent || b.value)));
  if (borrar) return "sigue el botón de borrar: vacía todo sin preguntar, pegado al de enviar (prevención de errores)";
  const enviarB = botones.find((b) => b.type === "submit" || (b.tagName === "BUTTON" && !b.getAttribute("type")));
  if (!enviarB) return "no encuentro el botón de enviar";
  const t = sinTildes(enviarB.textContent || enviarB.value);
  if (/^(enviar|aceptar|ok|submit|continuar)$/.test(t)) return `el botón dice «${espacios(enviarB.textContent || enviarB.value)}»: que diga lo que hace (pedir la cita)`;
  return true;
});

// ════════════ Bloque D · Verificación (UD12, RA6 d–f) ════════════
await comprobar("D", "👀", "👀 Las notas de la prueba (sesiones.md), con las tres personas", () => {
  if (!existsSync(join(RAIZ, "sesiones.md"))) return "falta sesiones.md: está en el kit";
  const s = sinTildes(leer("sesiones.md"));
  if (!/## remedios/.test(s) || !/## julian/.test(s) || !/## aya/.test(s)) return "sesiones.md no es el del kit: no lo cambies";
  return true;
});
const VERIF = () => leerMd("verificacion.md");
const VERDAD = { remedios: ["no", "no", "ayuda"], julian: ["ayuda", "si", "si"], aya: ["si", "no", "si"] };
const SUS = { remedios: 25, julian: 65, aya: 77.5 };
const resultado = (t) => {
  const x = sinTildes(t);
  if (/ayuda/.test(x)) return "ayuda";
  if (/^si\b|^✔|^exito/.test(x)) return "si";
  if (/^no\b|^✘/.test(x)) return "no";
  return "";
};
await comprobar("D", "D1.1", "✍️ El plan: qué queremos saber y tres tareas sin pistas, con su criterio de éxito", () => {
  const q = seccionMd(VERIF(), "Qué queremos saber");
  if (q === null) return "no encuentro «## Qué queremos saber»: no cambies los títulos";
  if (!q || SIN_RELLENAR.test(q) || q.split(/\s+/).length < 6) return "escribe en una frase qué queremos saber";
  const t = tablaMd(VERIF(), (cab) => cab.some((h) => h.startsWith("tarea")) && cab.some((h) => h.startsWith("exito")));
  if (!t) return "no encuentro la tabla de las tareas";
  const tareas = t.filas.filter((f) => /^T\d/i.test(f[0]));
  if (tareas.length < 3 || tareas.some((f) => !f[1] || !f[2])) return "faltan tareas: T1, T2 y T3, cada una con su tarea y su «Éxito si…»";
  for (const f of tareas) {
    const pista = /\b(pulse|pulsa|toque|toca|haz clic|haga clic|clica|pase el raton|pasa el raton|boton|icono|anular|pedir cita|mi cita|formulario|menu)\b/.exec(sinTildes(f[1]));
    if (pista) return `${f[0]} dice «${pista[0]}»: eso es una pista. La tarea dice lo que la persona QUIERE CONSEGUIR, no dónde pulsar`;
    if (f[1].split(/\s+/).length < 6) return `${f[0]} se queda corta: cuenta qué quiere conseguir la persona, como en la vida real`;
    if (f[2].split(/\s+/).length < 3) return `el «Éxito si…» de ${f[0]} no dice cómo sabes que lo ha conseguido`;
  }
  return true;
});
const resultadosTabla = () => {
  const t = tablaMd(VERIF(), (cab) => cab[0].startsWith("persona"));
  if (!t) throw conPista("no encuentro la tabla «Los resultados»: no cambies la fila de títulos");
  const out = {};
  for (const f of t.filas) {
    const k = sinTildes(f[0]).split(" ")[0];
    if (VERDAD[k]) out[k] = { r: [f[1], f[2], f[3]].map(resultado), sus: numero(f[4]), susTexto: f[4] ?? "" };
  }
  return out;
};
await comprobar("D", "D1.2", "✍️ Los resultados de cada persona en cada tarea (sí, no o con ayuda), como en las notas", () => {
  const r = resultadosTabla();
  for (const k of Object.keys(VERDAD)) {
    if (!r[k]) return `falta la fila de ${k}`;
    if (r[k].r.some((x) => !x)) return `la fila de ${k} tiene tareas sin rellenar («sí», «no» o «con ayuda»)`;
    const i = r[k].r.findIndex((x, n) => x !== VERDAD[k][n]);
    if (i >= 0) return `${k}, T${i + 1}: has puesto «${r[k].r[i]}». Vuelve a leer sus notas en sesiones.md (si le ayudaron, es «con ayuda», no «sí»)`;
  }
  return true;
});
await comprobar("D", "D1.3", "✍️ El SUS de cada persona, bien calculado", () => {
  const r = resultadosTabla();
  for (const k of Object.keys(SUS)) {
    if (!r[k] || Number.isNaN(r[k].sus)) return `falta el SUS de ${k}`;
    if (Math.abs(r[k].sus - SUS[k]) > 0.01) return `el SUS de ${k} no es ${r[k].susTexto}: ${r[k].sus > SUS[k] ? "¿has restado 1 en las impares y hecho 5 − respuesta en las pares?" : "¿has multiplicado por 2,5?"}`;
  }
  return true;
});
await comprobar("D", "D1.4", "✍️ La tasa de éxito y el SUS medio, y qué quieren decir", () => {
  const s = seccionMd(VERIF(), "Los resultados") ?? "";
  const tasa = /\*\*Tasa de éxito:\*\*[ \t]*(.*)/i.exec(s)?.[1] ?? "";
  const sus = /\*\*SUS medio:\*\*[ \t]*(.*)/i.exec(s)?.[1] ?? "";
  if (!tasa || /^\(/.test(tasa.trim())) return "falta la tasa de éxito";
  if (Math.abs(numero(tasa) - 44.4) > 0.5) return `la tasa de éxito no es ${tasa.trim()}: cuenta solo los «sí» (los «con ayuda» no) y divide entre los 9 intentos`;
  if (!sus || /^\(/.test(sus.trim())) return "falta el SUS medio";
  if (Math.abs(numero(sus) - 55.8) > 0.5) return `el SUS medio no es ${numero(sus)}: la media de los tres`;
  if (!/68|media|por debajo|problemas/.test(sinTildes(sus))) return "di qué quiere decir el SUS medio: compáralo con 68 (la media de miles de estudios)";
  return true;
});
const MOTOR = [[/chrome|edge|opera|brave|samsung/, "Blink"], [/firefox/, "Gecko"], [/safari|ipad|iphone|ios/, "WebKit"]];
await comprobar("D", "D1.5", "✍️ La matriz: el dedo, el teclado, el ratón, una conexión lenta y dos motores de navegador", () => {
  const t = tablaMd(VERIF(), (cab) => cab[0].startsWith("prueba"));
  if (!t) return "no encuentro la tabla «Periféricos y tecnologías»";
  const filas = t.filas.filter((f) => f.filter(Boolean).length >= 3);
  if (filas.length < 5) return `la matriz tiene ${filas.length} fila(s) completas: hacen falta 5 como mínimo (prueba, con qué y qué pasa)`;
  const todo = sinTildes(filas.map((f) => f.join(" ")).join(" "));
  const falta = [[/dedo|tactil|movil|tableta|modo dispositivo/, "con el dedo (pantalla táctil)"], [/teclado|\btab\b/, "solo con el teclado"], [/raton/, "con el ratón"], [/slow|3g|4g|lenta|network/, "con una conexión lenta"]].find(([re]) => !re.test(todo));
  if (falta) return `falta probarla ${falta[1]}`;
  const motores = new Set(MOTOR.filter(([re]) => re.test(todo)).map(([, m]) => m));
  if (motores.size < 2) return `solo has probado con ${[...motores][0] ?? "ningún"} motor: Chrome y Edge son el mismo (Blink). Usa Firefox (Gecko) o Safari (WebKit)`;
  return true;
});
const PROBLEMAS_D = [
  { n: 1, nombre: "«Anular» solo con el ratón", re: /anular|hover|pasar el raton/, arreglo: ["D2.1"] },
  { n: 2, nombre: "los iconos pequeños", re: /icono|20 ?px|pequen|diminut|hormiga|44/, arreglo: ["D2.2"] },
  { n: 3, nombre: "la portada lenta (LCP)", re: /portada|lcp|lazy|tarda|lenta/, arreglo: ["D3.1"] },
  { n: 4, nombre: "el aviso que salta (CLS)", re: /salta|cls|empuja|se mueve|se movio|aviso|gripe/, arreglo: ["D3.2"] },
  { n: 5, nombre: "el formulario de Pedir cita", re: /tarjeta|jerga|\bmap\b|motivo|hora|confirmac|formulario|solicitud/, arreglo: ["C2.1", "C2.2", "C2.4"] },
];
function problemasD() {
  const t = tablaMd(VERIF(), (cab) => cab.some((h) => h.startsWith("problema")) && cab.some((h) => h.startsWith("estado")));
  if (!t) throw conPista("no encuentro la tabla de problemas: no cambies la fila de títulos");
  const ix = { n: t.col("n"), problema: t.col("problema"), como: t.col("como"), cambio: t.col("cambio"), estado: t.col("estado") };
  if (Object.values(ix).some((x) => x < 0)) throw conPista("la tabla de problemas no tiene sus columnas");
  return t.filas.map((f) => ({ n: f[ix.n], problema: f[ix.problema] ?? "", tipo: PROBLEMAS_D.find((p) => p.re.test(sinTildes(f[ix.problema]))), como: f[ix.como] ?? "", cambio: f[ix.cambio] ?? "", estado: sinTildes(f[ix.estado]) }));
}
await comprobar("D", "D1.6", "✍️ Los problemas: al menos 4 distintos, con cómo se vio y el cambio que propones", () => {
  const filas = problemasD();
  if (!filas.length) return "la tabla de problemas está vacía: sale de las notas de sesiones.md y de tus pruebas";
  const tipos = new Set(filas.filter((f) => f.tipo).map((f) => f.tipo.n));
  if (tipos.size < 4) return `llevas ${tipos.size} problema(s) distintos; faltan ${4 - tipos.size}. Mira qué le pasó a cada persona en cada tarea, y lo que vio la enfermera con F12`;
  const sinComo = filas.find((f) => !/remedios|julian|aya|enfermera|dedo|tactil|modo dispositivo|teclado|raton|slow|4g|3g|lighthouse|performance|network|f12|lcp|cls|firefox|safari|chrome/.test(sinTildes(f.como)));
  if (sinComo) return `la fila ${sinComo.n} no dice cómo se vio: qué persona (Remedios, Julián, Aya) o qué prueba`;
  const sinCambio = filas.find((f) => espacios(f.cambio).split(" ").length < 3);
  if (sinCambio) return `la fila ${sinCambio.n} no dice qué cambio propones`;
  return true;
});
// D1.7 (el estado) al final
const ESCONDE = (d) => /^0(\.0+)?$/.test(d.opacity ?? "") || d.visibility === "hidden" || d.display === "none";
await comprobar("D", "D2.1", "✍️ «Anular» se ve siempre: con el dedo no hay hover (y sigue anulando)", async () => {
  css1();
  const base = reglas.filter((r) => !r.media && /cita__anular/.test(r.sel) && !/:hover|:focus/.test(r.sel));
  const esc = base.find((r) => ESCONDE(r.decl));
  if (esc) return `${esc.sel} { ${Object.entries(esc.decl).filter(([k]) => /opacity|visibility|display/.test(k)).map(([k, v]) => `${k}: ${v}`).join("; ")} }: sin ratón no aparece nunca (Remedios y Aya no pudieron anular)`;
  const suelto = reglas.find((r) => /:hover|:focus-within/.test(r.sel) && /cita/.test(r.sel) && !/hover:\s*hover/.test(r.media) && (r.decl.opacity || r.decl.visibility || r.decl.display));
  if (suelto) return `${suelto.sel}: lo que cambia con el ratón, solo dentro de @media (hover: hover), y que sea un extra`;
  const p = await pintar("mi-cita");
  const campo = $(p, "#codigo");
  if (!campo) return "no encuentro #codigo";
  escribir(campo, "K7Q2M9");
  enviar(campo.closest("form"));
  const b = $(p, ".cita__anular");
  if (!b) return "en la cita no está .cita__anular: no le quites la clase";
  if (b.tagName !== "BUTTON") return `«Anular» es un <${b.tagName.toLowerCase()}>: un <button>`;
  b.click();
  if (!$$(p, '[role="status"]').some((el) => /anulad/.test(sinTildes(el.textContent)))) return "al pulsar «Anular» ya no sale «Cita anulada…»";
  return true;
});
await comprobar("D", "D2.2", "✍️ Los iconos de la cita se pueden tocar con el dedo: al menos 44 × 44 px", () => {
  css1();
  const r = reglas.filter((x) => !x.media && x.sel.split(",").some((s) => s.trim() === ".cita__icono"));
  const medida = (prop) => Math.max(0, ...r.map((x) => aPx(x.decl[`min-${prop}`])), ...r.map((x) => aPx(x.decl[prop])));
  const an = medida("width");
  const al = medida("height");
  if (an < 44 || al < 44) return `el área que se toca mide ${an || "?"} × ${al || "?"} px: con el dedo hacen falta 44 × 44 (2,75rem), con min-width y min-height`;
  return true;
});
await comprobar("D", "D3.1", "✍️ La portada (el LCP): sin lazy, con su tamaño y en WebP", async () => {
  const img = $(await pintar("inicio"), ".portada__img");
  if (!img) return "no encuentro .portada__img";
  if (img.getAttribute("loading") === "lazy") return "la portada tiene loading=\"lazy\": es lo primero que se ve (el LCP) y el navegador la pide la última";
  if (img.getAttribute("fetchpriority") === "low") return "la portada con fetchpriority=\"low\": es lo más importante de la página";
  if (!img.getAttribute("width") || !img.getAttribute("height")) return "la portada sin width y height: hasta que llega, el navegador no sabe cuánto sitio guardarle (y la página salta)";
  const src = img.getAttribute("src") ?? "";
  const ligera = /\.(webp|avif)$/.test(src) || $$(img.closest("picture") ?? img, "source").some((s) => /image\/(webp|avif)/.test(s.getAttribute("type") ?? ""));
  if (!ligera) return "la portada es un JPG grande: en WebP pesa mucho menos (public/img/portada.webp)";
  if (!existsSync(join(RAIZ, "public", src.replace(/^\//, "")))) return `${src} no existe en public/`;
  return true;
});
await comprobar("D", "D3.2", "✍️ El aviso de la gripe está desde el principio: no salta nada al segundo", async () => {
  const p = await pintar("inicio");
  const antes = $$(p, ".aviso").length;
  await espera(1100);
  const despues = $$(p, ".aviso").length;
  if (antes === 0 && despues) return "el aviso aparece un segundo después y empuja toda la página (a Julián se le movió todo): ponlo en index.html desde el principio";
  if (!despues) return "no encuentro el aviso de la gripe (.aviso): no lo quites, que es importante";
  if (despues !== antes) return "al segundo sale otro aviso: quita el setTimeout de src/paginas/inicio.js";
  return true;
});

// ════════════ Al final: lo que depende de todo lo demás ════════════
const completo = !SOLO;
const rojas = (pref) => resultados.filter((r) => r.cuenta && !r.ok && pref.some((p) => r.id.startsWith(p))).map((r) => r.id);
const pdfPendiente = () => {
  const i = leer("index.html");
  return /vacuna-gripe\.pdf/.test(i);
};
const verdadB = (sit, filas) => {
  if (!completo) return "para saber si es verdad hay que comprobarlo todo: npm run comprobar (sin letra)";
  const pend = rojas(["A", "B2"]);
  if (sit === "plenamente conforme") {
    if (pend.length) return `«plenamente conforme», pero quedan barreras (${pend.join(", ")} en rojo)`;
    if (pdfPendiente()) return "«plenamente conforme», pero el folleto de la vacuna sigue siendo un PDF escaneado: quien no ve no puede leerlo";
  }
  if (sit === "no conforme" && pend.length <= 2) return "«no conforme» es cuando falla la mayoría (o no se ha evaluado): ¿es tu caso?";
  if (sit === "parcialmente conforme" && pend.length > 4) return `quedan ${pend.length} comprobaciones en rojo (${pend.join(", ")}): arregla primero y luego decide`;
  if (filas) {
    const pdf = filas.find((f) => f.tipo?.k === "pdf");
    if (pdf && pdfPendiente() && pdf.estado.startsWith("arreglad")) return `la fila ${pdf.n} (el folleto) dice «arreglado», y el PDF sigue enlazado tal cual`;
    for (const f of filas.filter((x) => x.tipo && x.tipo.k !== "pdf")) {
      const id = { ancho: "B2.1", color: "B2.2", boton: "B2.3", movimiento: "B2.4" }[f.tipo.k];
      const rojo = pend.includes(id);
      if (!/^(pendiente|arreglad)/.test(f.estado)) return `la fila ${f.n} no tiene estado: «pendiente» o «arreglado»`;
      if (f.estado.startsWith("arreglad") && rojo) return `la fila ${f.n} dice «arreglado», pero ${id} sigue en rojo`;
      if (f.estado.startsWith("pendiente") && !rojo) return `la fila ${f.n} sigue «pendiente», pero ${id} ya está en verde: actualiza el estado`;
    }
  }
  return true;
};
if (!SOLO || SOLO === "B") {
  await comprobar("B", "B3.1", "✍️ La situación de cumplimiento, la misma en el informe y la declaración, y verdad", () => {
    const enInforme = situacion(leerMd("informe.md"));
    const enDecl = situacion(DECLARACION());
    if (!enInforme) return "en informe.md falta la situación de cumplimiento: «no conforme», «parcialmente conforme» o «plenamente conforme»";
    if (!enDecl) return "en declaracion.md, rellena «Situación de cumplimiento:» con una de las tres";
    if (enInforme !== enDecl) return `la declaración dice «${enDecl}» y el informe «${enInforme}»: tienen que decir lo mismo`;
    return verdadB(enDecl, filasInforme());
  });
}
if (!SOLO || SOLO === "D") {
  await comprobar("D", "D1.7", "✍️ El estado de cada problema dice la verdad", () => {
    const filas = problemasD();
    if (!filas.length) return "la tabla de problemas está vacía";
    const sinEstado = filas.find((f) => !/^(pendiente|arreglad)/.test(f.estado));
    if (sinEstado) return `la fila ${sinEstado.n} no tiene estado: «pendiente» o «arreglado»`;
    if (!completo) return "para saber si es verdad hay que comprobarlo todo: npm run comprobar (sin letra)";
    const r = new Set(rojas(["C2", "D2", "D3"]));
    const mentira = filas.find((f) => f.estado.startsWith("arreglad") && f.tipo?.arreglo.some((a) => r.has(a)));
    if (mentira) return `la fila ${mentira.n} dice «arreglado», pero ${mentira.tipo.arreglo.filter((a) => r.has(a)).join(" y ")} (${mentira.tipo.nombre}) sigue en rojo`;
    const olvidada = filas.find((f) => f.estado.startsWith("pendiente") && f.tipo && f.tipo.arreglo.every((a) => !r.has(a)));
    if (olvidada) return `la fila ${olvidada.n} sigue «pendiente», pero ya está en verde: ¿lo has vuelto a probar?`;
    return true;
  });
}
// que salgan en su sitio
const mover = (id, tras) => {
  const i = resultados.findIndex((r) => r.id === id);
  if (i < 0) return;
  const [r] = resultados.splice(i, 1);
  const j = resultados.findIndex((x) => x.id === tras);
  resultados.splice(j < 0 ? resultados.length : j + 1, 0, r);
};
mover("B3.1", "B2.4");
mover("D1.7", "D1.6");

// ───────────── el resultado ─────────────
const cuentan = resultados.filter((r) => r.cuenta);
const bien = cuentan.filter((r) => r.ok).length;
const BLOQUES = { A: "Accesibilidad (UD9)", B: "Auditoría (UD10)", C: "Usabilidad (UD11)", D: "Verificación (UD12)" };
if (JSON_OUT) {
  const porBloque = Object.fromEntries(Object.keys(BLOQUES).map((b) => [b, { bien: cuentan.filter((r) => r.bloque === b && r.ok).length, total: cuentan.filter((r) => r.bloque === b).length }]));
  console.log(JSON.stringify({ bien, total: cuentan.length, porBloque, resultados }, null, 2));
} else {
  console.log(c(1, "\n🩺 Práctica 4 · Cita Fácil · Consultorio Los Alcatraces\n"));
  let actual = null;
  let primero = true;
  for (const r of resultados) {
    if (r.bloque !== actual) {
      actual = r.bloque;
      const b = cuentan.filter((x) => x.bloque === r.bloque);
      console.log(c(1, `Bloque ${r.bloque} · ${BLOQUES[r.bloque]} · ${b.filter((x) => x.ok).length}/${b.length}`));
    }
    const marca = r.ok ? c(32, "✔") : r.cuenta ? c(31, "✘") : c(33, "•");
    console.log(`  ${marca} ${r.id === "👀" ? "" : r.id + " "}${r.texto}`);
    if (!r.ok) {
      console.log(c(2, `      ${r.pista}`));
      if (r.cuenta && EMPEZAR[r.id] && (SOLO || primero)) {
        console.log(c(36, `      💡 Para empezar: ${EMPEZAR[r.id]}`));
        primero = false;
      }
    }
  }
  const total = cuentan.length;
  console.log(c(1, `\n${bien === total ? "🎉 " : ""}${bien} de ${total} comprobaciones en verde${SOLO ? ` (bloque ${SOLO})` : ""}\n`));
  if (!SOLO) console.log(c(2, "Lo que no comprueba ninguna máquina: que la use un paciente de verdad. Eso, en la defensa.\n"));
}
process.exitCode = 0;
setTimeout(() => process.exit(0), 50);
