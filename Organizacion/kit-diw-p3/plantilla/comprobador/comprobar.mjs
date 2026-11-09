// comprobar.mjs — El comprobador de la P3 (Cine Bahía). Se lanza con:
//     docker compose run --rm web npm run comprobar        (todo)
//     docker compose run --rm web npm run comprobar A      (solo el bloque A; o B)
// Llama a tus componentes con distintos datos y mira el HTML que devuelven; lee tus historias (stories); monta las
// páginas en un navegador de mentira (happy-dom) y elige, pulsa y envía como lo haría una persona; mira el CSS
// compilado y compila el catálogo de Storybook. Te dice qué falla, NO la solución.
//
//   node comprobador/comprobar.mjs [A|B] [--rapido]   → resumen con colores (--rapido: sin compilar Storybook)
//   node comprobador/comprobar.mjs --json             → resultado en JSON (lo usa el corrector del profesor)
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Window } from "happy-dom";
import * as sass from "sass";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const ARGS = process.argv.slice(2);
const JSON_OUT = ARGS.includes("--json");
const RAPIDO = ARGS.includes("--rapido");
const SOLO = ARGS.find((a) => /^[AB]$/i.test(a))?.toUpperCase();
const color = process.stdout.isTTY && !JSON_OUT;
const c = (n, t) => (color ? `\x1b[${n}m${t}\x1b[0m` : t);
const C = "src/components/";
const leer = (f) => (existsSync(join(RAIZ, f)) ? readFileSync(join(RAIZ, f), "utf8") : "");
const sinComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
const espacios = (t) => String(t ?? "").replace(/[\s  ]+/g, " ").trim();
const sinTildes = (t) => espacios(t).normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

// ───────────── un navegador de mentira (happy-dom) ─────────────
const ventana = new Window({ url: "http://localhost:5190/" });
for (const k of ["window", "document", "navigator", "HTMLElement", "Element", "Node", "Event", "MouseEvent", "KeyboardEvent",
  "InputEvent", "FocusEvent", "PointerEvent", "getComputedStyle", "HTMLInputElement", "HTMLButtonElement", "HTMLVideoElement",
  "HTMLMediaElement", "DocumentFragment", "MutationObserver", "CustomEvent", "URLSearchParams"]) {
  if (ventana[k] || k === "window") Object.defineProperty(globalThis, k, { value: k === "window" ? ventana : ventana[k], configurable: true, writable: true });
}
// Como en el navegador: textContent = 0 escribe «0» (happy-dom lo deja vacío)
for (const proto of [ventana.Node.prototype, ventana.Element.prototype, ventana.HTMLElement.prototype]) {
  const d = Object.getOwnPropertyDescriptor(proto, "textContent");
  if (d?.set) Object.defineProperty(proto, "textContent", { ...d, set(v) { d.set.call(this, v === null || v === undefined ? "" : String(v)); } });
}
// El vídeo no se ve aquí: contamos las veces que se llama a play() y decidimos qué devuelve
let reproducciones = 0;
let playFalla = false;
ventana.HTMLMediaElement.prototype.play = function () {
  reproducciones++;
  return playFalla ? Promise.reject(new Error("NotAllowedError")) : Promise.resolve();
};
let sinCatch = 0;
process.on("unhandledRejection", () => sinCatch++);
const espera = () => new Promise((r) => setTimeout(r, 5));

/** Convierte el HTML (texto) en nodos para poder mirarlos con querySelector */
function dom(html) {
  const caja = document.createElement("div");
  caja.innerHTML = String(html ?? "");
  return caja;
}
/** Importa un módulo del alumno; si falla, devuelve el error */
async function cargar(fichero) {
  try {
    return { m: await import(pathToFileURL(join(RAIZ, fichero)).href) };
  } catch (e) {
    return { error: e.message.split("\n")[0] };
  }
}
const mods = {};
for (const [k, f] of Object.entries({
  boton: "atomos/boton/boton.js",
  botonH: "atomos/boton/boton.stories.js",
  edad: "atomos/etiqueta-edad/etiqueta-edad.js",
  edadH: "atomos/etiqueta-edad/etiqueta-edad.stories.js",
  sesion: "moleculas/sesion/sesion.js",
  sesionH: "moleculas/sesion/sesion.stories.js",
  tarjeta: "organismos/tarjeta-pelicula/tarjeta-pelicula.js",
  tarjetaH: "organismos/tarjeta-pelicula/tarjeta-pelicula.stories.js",
  plantilla: "plantillas/cartelera/cartelera.js",
  plantillaH: "plantillas/cartelera/cartelera.stories.js",
  filtroI: "plantillas/cartelera/cartelera.interaccion.js",
  pagina: "paginas/cartelera/cartelera.js",
  paginaH: "paginas/cartelera/cartelera.stories.js",
  butacas: "organismos/selector-butacas/selector-butacas.js",
  butacasI: "organismos/selector-butacas/selector-butacas.interaccion.js",
  butacasH: "organismos/selector-butacas/selector-butacas.stories.js",
  compra: "paginas/compra/compra.js",
  compraI: "organismos/formulario-compra/formulario-compra.interaccion.js",
  trailer: "moleculas/trailer/trailer.js",
  trailerI: "moleculas/trailer/trailer.interaccion.js",
})) {
  mods[k] = await cargar(C + f);
}
const datos = (await import(pathToFileURL(join(RAIZ, "src/datos/cartelera.js")).href));
const fn = (k, nombre) => {
  if (mods[k].error) throw new Error(`no se puede cargar el fichero (${mods[k].error})`);
  const f = mods[k].m[nombre];
  if (typeof f !== "function") throw new Error(`el fichero no exporta la función ${nombre}`);
  return f;
};

// ───────────── las historias (stories) ─────────────
function pintarHistoria(meta, historia) {
  const args = { ...(meta.args || {}), ...(historia.args || {}) };
  const render = historia.render || meta.render;
  const r = render ? render(args, {}) : "";
  return { args, html: typeof r === "string" ? r : r?.outerHTML ?? "" };
}
function historias(k) {
  if (mods[k].error) throw new Error(`no se puede cargar el fichero de historias (${mods[k].error})`);
  const meta = mods[k].m.default || {};
  const lista = Object.entries(mods[k].m).filter(([n, v]) => n !== "default" && n !== "__namedExportsOrder" && v && typeof v === "object");
  return { meta, lista };
}
const opciones = (at) => (at?.options || []).map(String);
const tipoControl = (at) => (typeof at?.control === "string" ? at.control : at?.control?.type);
/** Lo común: title, nº de historias, que todas se pinten y que cada control tenga su descripción */
function cabecera(k, titulo, minimo, { descripciones = true } = {}) {
  const { meta, lista } = historias(k);
  if (meta.title !== titulo) return `el title es «${meta.title ?? "(ninguno)"}» y tiene que ser «${titulo}»: el NIVEL de Atomic Design y el nombre (mira boton.stories.js)`;
  if (lista.length < minimo) return `hay ${lista.length} historia(s) y se piden ${minimo} como mínimo`;
  if (typeof meta.render !== "function") return "falta render en el export default: ¿cómo pinta Storybook el componente?";
  for (const [nombre, h] of lista) if (!pintarHistoria(meta, h).html.trim()) return `la historia ${nombre} no pinta nada`;
  if (descripciones) {
    const sin = Object.entries(meta.argTypes || {}).filter(([, at]) => !at?.table?.disable && !String(at?.description ?? "").trim()).map(([n]) => n);
    if (sin.length) return `en la pestaña Docs, ${sin.join(", ")} sale sin explicar: ponle description en argTypes (apartado 9.2 de la UD7)`;
  }
  return true;
}

// ───────────── el CSS de verdad (el SCSS compilado) ─────────────
let css = "";
let errorCss = "";
try {
  css = sass.compile(join(RAIZ, "scss/main.scss"), { style: "expanded" }).css;
} catch (e) {
  errorCss = e.message.split("\n")[0];
}
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
        out.push({ sel: cab, media: pila.join(" "), decl: Object.fromEntries([...cuerpo.matchAll(/([\w-]+)\s*:\s*([^;]+);?/g)].map((d) => [d[1].trim(), d[2].trim()])) });
        i = fin;
        inicio = fin + 1;
      }
    } else if (ch === "}") {
      pila.pop();
      inicio = i + 1;
    }
    i++;
  }
  return out;
}
const reglas = leerReglas(css);
const propiedad = (selector, prop) => {
  let v = null;
  for (const r of reglas) if (!r.media && r.sel.split(",").some((s) => s.trim() === selector) && r.decl[prop]) v = r.decl[prop];
  return v;
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
  resultados.push({ bloque, id, texto, ok, pista, cuenta: !texto.startsWith("👀") });
}
const PELI = datos.peliculas[0];
const SIN = datos.peliculas.find((p) => !p.sesiones.length);
const euros = (n) => espacios(new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n));

// 👀 El Botón (ya resuelto: no cuenta)
await comprobar("A", "👀", "👀 Botón: cinco historias, una por variante (ejemplo resuelto)", () => {
  const r = cabecera("botonH", "Átomos/Botón", 5);
  if (r !== true) return r;
  const b = dom(fn("boton", "Boton")({ variante: "secundario" })).querySelector("button");
  return b?.classList.contains("boton--secundario") || "el Botón ya no es el del ejemplo: vuelve a copiarlo del kit";
});

// ── Bloque A · Componentes y catálogo (UD7) ──
const EDADES = ["tp", "7", "12", "16", "18"];
await comprobar("A", "A1.1", "Etiqueta de edad: un <span> con su bloque y su modificador, «+12» y lo que significa", () => {
  const E = fn("edad", "EtiquetaEdad");
  for (const edad of EDADES) {
    const s = dom(E({ edad })).firstElementChild;
    if (!s || s.tagName !== "SPAN") return `EtiquetaEdad({ edad: "${edad}" }) no devuelve un <span>`;
    if (!s.classList.contains("etiqueta-edad")) return "falta la clase del bloque (etiqueta-edad)";
    if (!s.classList.contains(`etiqueta-edad--${edad}`)) return `con edad "${edad}" falta su modificador: mira las clases que ya hay en _etiqueta-edad.scss`;
    const corto = edad === "tp" ? "TP" : `+${edad}`;
    const oculto = s.querySelector(".visualmente-oculto");
    const visible = espacios(s.textContent.replace(oculto?.textContent ?? "", ""));
    if (visible !== corto) return `con edad "${edad}" tiene que verse «${corto}», y se ve «${visible}»`;
    const largo = sinTildes(oculto?.textContent);
    if (!oculto || !(edad === "tp" ? /todos los publicos/.test(largo) : largo.includes(`menores de ${edad}`)))
      return `«${corto}» no dice nada a quien usa un lector de pantalla: añade dentro un <span class="visualmente-oculto"> con lo que significa (${edad === "tp" ? "todos los públicos" : `no recomendada para menores de ${edad} años`})`;
  }
  if (!dom(E()).firstElementChild?.classList.contains("etiqueta-edad--tp")) return "EtiquetaEdad() sin nada tiene que salir como TP";
  const x = dom(E({ edad: "12", clases: "tarjeta-pelicula__edad" })).firstElementChild;
  if (!x?.classList.contains("tarjeta-pelicula__edad")) return "con clases: \"tarjeta-pelicula__edad\" esa clase tiene que estar en el <span> (la mezcla BEM de la UD5)";
  if (/undefined|null/.test(dom(E({ edad: "12" })).innerHTML)) return "sale «undefined» en el HTML: ¿una prop sin valor por defecto?";
  return true;
});
await comprobar("A", "A1.2", "Historias de la Etiqueta: title, un «select» con las cinco edades y una historia por edad", () => {
  const r = cabecera("edadH", "Átomos/Etiqueta de edad", 5);
  if (r !== true) return r;
  const { meta, lista } = historias("edadH");
  const at = meta.argTypes?.edad;
  if (tipoControl(at) !== "select") return "la edad necesita un control de tipo «select» en argTypes";
  if (EDADES.some((o) => !opciones(at).includes(o))) return `el «select» de la edad tiene que ofrecer las cinco: ${EDADES.join(", ")}`;
  const vistas = new Set(lista.map(([, h]) => String(pintarHistoria(meta, h).args.edad)));
  if (EDADES.some((e) => !vistas.has(e))) return `falta una historia para: ${EDADES.filter((e) => !vistas.has(e)).join(", ")} (cada historia, con sus args)`;
  return true;
});
await comprobar("A", "A2.1", "Sesión: un enlace a la compra con el día, la hora, la sala y el formato (solo si lo hay)", () => {
  const S = fn("sesion", "Sesion");
  const s = PELI.sesiones[1];
  const a = dom(S({ ...s, pelicula: PELI.id })).firstElementChild;
  if (!a || a.tagName !== "A" || !a.classList.contains("sesion")) return "Sesion() tiene que devolver un <a class=\"sesion\">: es un enlace a la página de compra";
  const href = a.getAttribute("href") ?? "";
  if (!href.startsWith("/compra.html?") || !/pelicula=luz-caleta/.test(href) || !new RegExp(`sesion=${s.id}`).test(href))
    return `el enlace va a «${href}»: tiene que ir a /compra.html?pelicula=${PELI.id}&sesion=${s.id} (con &amp; dentro del HTML)`;
  const txt = (cl) => espacios(a.querySelector(`.sesion__${cl}`)?.textContent);
  if (txt("dia") !== "Sábado") return `.sesion__dia dice «${txt("dia")}»: con dia "sab" tiene que decir «Sábado» (usa DIAS de src/datos/cartelera.js)`;
  if (txt("hora") !== s.hora || txt("sala") !== s.sala) return "faltan .sesion__hora o .sesion__sala con la hora y la sala";
  if (txt("formato") !== "VOSE") return "con formato \"VOSE\" falta la chapa <span class=\"sesion__formato\">VOSE</span>";
  const sinF = dom(S({ ...PELI.sesiones[0], pelicula: PELI.id }));
  if (sinF.querySelector(".sesion__formato")) return "sin formato no tiene que salir la chapa (ni vacía): ¿una condición? (apartado 5.4 de la UD7)";
  if (/undefined/.test(sinF.innerHTML)) return "sin formato sale «undefined» en el HTML";
  return true;
});
await comprobar("A", "A2.2", "Historias de la Sesión: title, «select» del formato y una historia con formato y otra sin", () => {
  const r = cabecera("sesionH", "Moléculas/Sesión", 2);
  if (r !== true) return r;
  const { meta, lista } = historias("sesionH");
  const at = meta.argTypes?.formato;
  if (tipoControl(at) !== "select") return "el formato necesita un control «select» en argTypes";
  if (["", "VOSE", "3D"].some((o) => !opciones(at).includes(o))) return "el «select» del formato: \"\" (normal), VOSE y 3D";
  const f = lista.map(([, h]) => pintarHistoria(meta, h).args.formato || "");
  if (!f.includes("") || !f.some(Boolean)) return "hace falta una historia sin formato y otra con formato";
  return true;
});
const tarjeta = (p) => dom(fn("tarjeta", "TarjetaPelicula")(p)).querySelector("article.tarjeta-pelicula");
await comprobar("A", "A3.1", "Tarjeta de película: el cartel con <picture> (WebP y JPG), alt, su tamaño y diferido", () => {
  const t = tarjeta(PELI);
  if (!t) return "TarjetaPelicula() tiene que devolver un <article class=\"tarjeta-pelicula\">";
  const pic = t.querySelector("picture");
  if (!pic) return "el cartel va en un <picture>: el navegador elige el formato (apartado 4.1 de la UD6)";
  const src = pic.querySelector("source");
  const img = pic.querySelector("img");
  if (!src || !img) return "dentro del <picture>: un <source> y, el último, el <img>";
  if (pic.lastElementChild !== img) return "el <img> va el último dentro del <picture>";
  if (src.getAttribute("type") !== "image/webp" || src.getAttribute("srcset") !== `${PELI.poster}.webp`) return `el <source> con srcset="${PELI.poster}.webp" y type="image/webp"`;
  if (img.getAttribute("src") !== `${PELI.poster}.jpg`) return `el <img> con src="${PELI.poster}.jpg" (el formato de siempre, por si el navegador no entiende WebP)`;
  if (!img.classList.contains("tarjeta-pelicula__poster")) return "el <img> con la clase tarjeta-pelicula__poster";
  if (!sinTildes(img.getAttribute("alt")).includes(sinTildes(PELI.titulo))) return "el alt del cartel tiene que decir de qué película es (con su título)";
  if (img.getAttribute("width") !== "300" || img.getAttribute("height") !== "450") return "el <img> con width=\"300\" height=\"450\" (el tamaño de los carteles): así no salta la página";
  if (img.getAttribute("loading") !== "lazy") return "los carteles están más abajo: loading=\"lazy\"";
  return true;
});
await comprobar("A", "A3.2", "Tarjeta: compone la Etiqueta, y la duración y el precio, a la española", () => {
  const src = sinComentarios(leer(C + "organismos/tarjeta-pelicula/tarjeta-pelicula.js"));
  if (!/import\s*\{[^}]*\bEtiquetaEdad\b[^}]*\}\s*from\s*["']\.\.\/\.\.\/atomos\/etiqueta-edad\/etiqueta-edad\.js["']/.test(src)) return "el organismo tiene que importar EtiquetaEdad del átomo (componer, no copiar)";
  if (!/import\s*\{[^}]*\bSesion\b[^}]*\}\s*from\s*["']\.\.\/\.\.\/moleculas\/sesion\/sesion\.js["']/.test(src)) return "el organismo tiene que importar Sesion de la molécula";
  const t = tarjeta(PELI);
  if (espacios(t.querySelector("h3.tarjeta-pelicula__titulo")?.textContent) !== PELI.titulo) return "el título, en un <h3 class=\"tarjeta-pelicula__titulo\">";
  const e = t.querySelector(".etiqueta-edad");
  if (!e?.classList.contains(`etiqueta-edad--${PELI.edad}`) || !e.classList.contains("tarjeta-pelicula__edad")) return "falta la Etiqueta de edad de la película, con la clase tarjeta-pelicula__edad";
  for (const [min, txt] of [[112, "1 h 52 min"], [60, "1 h"], [88, "1 h 28 min"], [45, "45 min"]]) {
    const d = espacios(tarjeta({ ...PELI, duracion: min }).querySelector(".tarjeta-pelicula__datos")?.textContent);
    if (d !== `${PELI.genero} · ${txt}`) return `con duracion: ${min}, .tarjeta-pelicula__datos dice «${d}» y tiene que decir «${PELI.genero} · ${txt}»`;
  }
  for (const precio of [5.5, 4]) {
    const p = espacios(tarjeta({ ...PELI, precio }).querySelector(".tarjeta-pelicula__precio")?.textContent);
    if (p !== euros(precio)) return `con precio: ${precio}, .tarjeta-pelicula__precio dice «${p}» y tiene que decir «${euros(precio)}» (Intl.NumberFormat, apartado 5.5 de la UD7)`;
  }
  return true;
});
await comprobar("A", "A3.3", "Tarjeta: una Sesión por cada una (o «Sin sesiones esta semana») y los datos para el filtro", () => {
  const t = tarjeta(PELI);
  const li = [...t.querySelectorAll("ul.tarjeta-pelicula__sesiones > li")];
  if (li.length !== PELI.sesiones.length) return `con ${PELI.sesiones.length} sesiones hay ${li.length} <li> en <ul class="tarjeta-pelicula__sesiones">`;
  if (li.some((x, i) => !x.querySelector(`a.sesion[href*="pelicula=${PELI.id}"][href*="sesion=${PELI.sesiones[i].id}"]`))) return "cada <li> con su Sesión, que lleve a la compra de ESTA película (pásale pelicula: id)";
  const s = tarjeta(SIN);
  if (s.querySelector(".tarjeta-pelicula__sesiones")) return "sin sesiones no tiene que salir la lista vacía";
  if (espacios(s.querySelector(".tarjeta-pelicula__aviso")?.textContent) !== "Sin sesiones esta semana") return "sin sesiones, un <p class=\"tarjeta-pelicula__aviso\">Sin sesiones esta semana</p>";
  if (t.dataset.edad !== PELI.edad) return `el <article> necesita data-edad="${PELI.edad}" (lo usa el filtro del bloque B)`;
  const dosVie = tarjeta({ ...PELI, sesiones: [PELI.sesiones[0], { ...PELI.sesiones[0], id: "x" }, PELI.sesiones[1]] });
  if (t.dataset.dias !== "vie sab" || dosVie.dataset.dias !== "vie sab") return `el <article> necesita data-dias con los días de sus sesiones, separados por un espacio y sin repetir: "vie sab" (y ahora dice "${dosVie.dataset.dias ?? ""}")`;
  if (s.dataset.dias !== "") return "sin sesiones, data-dias=\"\" (vacío)";
  return true;
});
await comprobar("A", "A3.4", "Historias de la Tarjeta: title, controles del precio y la edad, y una sin sesiones", () => {
  const r = cabecera("tarjetaH", "Organismos/Tarjeta de película", 3);
  if (r !== true) return r;
  const { meta, lista } = historias("tarjetaH");
  if (tipoControl(meta.argTypes?.precio) !== "number") return "el precio necesita un control de tipo número (number) en argTypes";
  if (tipoControl(meta.argTypes?.edad) !== "select" || EDADES.some((o) => !opciones(meta.argTypes.edad).includes(o))) return "la edad, con un «select» de las cinco edades";
  const pintadas = lista.map(([n, h]) => [n, pintarHistoria(meta, h)]);
  if (!pintadas.some(([, p]) => !(p.args.sesiones || []).length)) return "falta una historia sin sesiones (la de «Mareas vivas»)";
  for (const [n, p] of pintadas) if (!dom(p.html).querySelector("img")?.getAttribute("src")?.endsWith(".jpg")) return `la historia ${n} sale sin cartel: usa una película de src/datos/cartelera.js en los args`;
  return true;
});
const RELLENO = { cabecera: '<header class="x-cab">Cabecera</header>', destacado: '<section class="x-des">Estreno</section>', filtro: '<form class="x-fil">Filtro</form>' };
await comprobar("A", "A4.1", "Plantilla Cartelera: cada hueco en su sitio, el <h1>, la rejilla de <li> y el contador", () => {
  const P = fn("plantilla", "PlantillaCartelera");
  const p = dom(P({ ...RELLENO, tarjetas: ["<article>1</article>", "<article>2</article>", "<article>3</article>"] }));
  const main = p.querySelector("main");
  if (!main) return "la plantilla necesita un <main> con lo principal";
  if (!p.querySelector(".x-cab") || main.contains(p.querySelector(".x-cab"))) return "la cabecera va fuera del <main>, antes";
  if (!main.querySelector("h1")) return "falta el <h1> de la página dentro del <main>";
  if (!main.contains(p.querySelector(".x-des")) || !main.contains(p.querySelector(".x-fil"))) return "el destacado y el filtro van dentro del <main>";
  const lis = [...p.querySelectorAll("ul.cartelera__rejilla > li")];
  if (lis.length !== 3 || lis.some((li, i) => espacios(li.textContent) !== String(i + 1))) return "cada tarjeta en su <li>, dentro de <ul class=\"cartelera__rejilla\">";
  const cont = p.querySelector("p.cartelera__contador");
  if (espacios(cont?.textContent) !== "3 películas") return "falta <p class=\"cartelera__contador\"> con «3 películas»";
  if (cont.getAttribute("role") !== "status") return "el contador cambiará al filtrar (bloque B): role=\"status\" para que lo oiga el lector de pantalla";
  const uno = espacios(dom(P({ ...RELLENO, tarjetas: ["<article>1</article>"] })).querySelector(".cartelera__contador")?.textContent);
  if (uno !== "1 película") return `con una tarjeta, el contador dice «${uno}»: en singular, «1 película»`;
  if (/undefined/.test(dom(P()).innerHTML)) return "PlantillaCartelera() sin nada saca «undefined»: valores por defecto";
  return true;
});
await comprobar("A", "A4.2", "La rejilla se adapta sola al ancho: grid con repeat(auto-fill, minmax(…)), sin anchos fijos", () => {
  if (errorCss) return `el SCSS no compila: ${errorCss}`;
  if (propiedad(".cartelera__rejilla", "display") !== "grid") return ".cartelera__rejilla { display: grid } en _cartelera.scss";
  const g = propiedad(".cartelera__rejilla", "grid-template-columns") ?? "";
  if (!/repeat\(\s*auto-(fill|fit)\s*,\s*minmax\(/.test(g)) return `grid-template-columns: ${g || "(ninguno)"}: con repeat(auto-fill, minmax(…, 1fr)) las columnas salen solas, sin media queries (UD4)`;
  if (/minmax\(\s*\d+(\.\d+)?(px|rem|em)\s*,/.test(g)) return "si el mínimo es fijo (16rem), en un móvil de 240 px se sale: minmax(min(100%, 16rem), 1fr)";
  if (!/none/.test(propiedad(".cartelera__rejilla", "list-style") ?? "")) return "es un <ul>: list-style: none (y sin margin ni padding)";
  if (!propiedad(".cartelera__rejilla", "gap")) return "falta el gap entre las tarjetas (con un token de espacio)";
  return true;
});
await comprobar("A", "A4.3", "La página Cartelera: la plantilla con los datos de verdad, y sus dos historias", () => {
  const P = fn("pagina", "PaginaCartelera");
  const p = dom(P());
  const n = p.querySelectorAll(".cartelera__rejilla > li > article.tarjeta-pelicula").length;
  if (n !== datos.peliculas.length) return `la página tiene ${n} tarjetas y en src/datos/cartelera.js hay ${datos.peliculas.length} películas`;
  if (!p.querySelector('.cabecera [aria-current="page"][href="/"]')) return "falta la Cabecera, con «Cartelera» marcada como la página actual";
  if (!p.querySelector(".estreno") || !p.querySelector(".filtro")) return "faltan el Estreno de la semana y el Filtro de la cartelera en sus huecos";
  if (dom(P({ datos: [datos.peliculas[1]] })).querySelectorAll("article.tarjeta-pelicula").length !== 1) return "PaginaCartelera({ datos: [...] }) tiene que pintar las películas que le pasen (usa la prop datos)";
  const pl = historias("plantillaH");
  if (pl.meta.title !== "Plantillas/Cartelera") return `el title de la historia de la plantilla es «${pl.meta.title ?? "(ninguno)"}»: «Plantillas/Cartelera»`;
  if (!pl.lista.length || !pintarHistoria(pl.meta, pl.lista[0][1]).html.includes("cartelera__rejilla")) return "la historia de la plantilla tiene que pintarla con contenido de relleno";
  const pg = historias("paginaH");
  if (pg.meta.title !== "Páginas/Cartelera") return `el title de la historia de la página es «${pg.meta.title ?? "(ninguno)"}»: «Páginas/Cartelera»`;
  if (!pg.lista.length) return "la página necesita al menos una historia";
  for (const m of [pl.meta, pg.meta]) if (m.parameters?.layout !== "fullscreen") return `en «${m.title}», parameters: { layout: "fullscreen" }: una página ocupa toda la pantalla`;
  return true;
});
let indice = null;
let errorBuild = "";
if (!RAPIDO && (!SOLO || SOLO === "A")) {
  const salida = join("/tmp", `sb-p3-${process.pid}`);
  try {
    execFileSync("npx", ["storybook", "build", "--quiet", "-o", salida], { cwd: RAIZ, stdio: "pipe", env: { ...process.env, STORYBOOK_DISABLE_TELEMETRY: "1" } });
    indice = JSON.parse(readFileSync(join(salida, "index.json"), "utf8"));
  } catch (e) {
    errorBuild = String(e.stderr || e.stdout || e.message).split("\n").filter((l) => /error|Error|✘/.test(l)).slice(0, 3).join(" · ") || "no compila";
  } finally {
    rmSync(salida, { recursive: true, force: true });
  }
}
await comprobar("A", "A4.4", "El catálogo de Storybook compila, con los cinco niveles de Atomic Design y nada pendiente", () => {
  if (RAPIDO) return "sin comprobar (--rapido)";
  if (!indice) return `Storybook no compila: ${errorBuild}`;
  const titulos = [...new Set(Object.values(indice.entries).map((e) => e.title))];
  const pendientes = titulos.filter((t) => /pendiente|✍️/i.test(t));
  if (pendientes.length) return `quedan historias sin hacer: ${pendientes.join(", ")}`;
  const niveles = ["Átomos", "Moléculas", "Organismos", "Plantillas", "Páginas"];
  const faltan = niveles.filter((n) => !titulos.some((t) => t.startsWith(n + "/")));
  if (faltan.length) return `en el menú faltan los niveles: ${faltan.join(", ")}`;
  const raros = titulos.filter((t) => !niveles.some((n) => t.startsWith(n + "/")));
  if (raros.length) return `hay títulos fuera de los cinco niveles: ${raros.join(", ")}`;
  return true;
});

// ── Bloque B · Interactividad (UD8) ──
function montar(html, ...activar) {
  const caja = document.createElement("div");
  caja.innerHTML = html;
  document.body.replaceChildren(caja);
  for (const f of activar) f(caja);
  return caja;
}
const cartelera = () => montar(fn("pagina", "PaginaCartelera")(), fn("filtroI", "activarFiltro"));
function elegirOpcion(select, valor) {
  if (!select) throw Object.assign(new Error("sin filtro"), { pista: "la página no tiene el Filtro: el B1 necesita antes el A4 (PaginaCartelera con el Filtro de la cartelera)" });
  select.value = valor;
  select.dispatchEvent(new Event("input", { bubbles: true }));
  select.dispatchEvent(new Event("change", { bubbles: true }));
}
const vistas = (p) => [...p.querySelectorAll(".cartelera__rejilla > li")].filter((li) => !li.hidden).map((li) => espacios(li.querySelector(".tarjeta-pelicula__titulo")?.textContent));
const T = Object.fromEntries(datos.peliculas.map((p) => [p.id, p.titulo]));
const igual = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
await comprobar("B", "B1.1", "Filtro: por día, solo las películas con sesión ese día", () => {
  const p = cartelera();
  const dia = p.querySelector(".filtro__dia");
  for (const [d, ids] of [["vie", ["luz-caleta", "levante"]], ["dom", ["pulpo-jacinta", "ultimo-tranvia"]], ["", Object.keys(T)]]) {
    elegirOpcion(dia, d);
    const v = vistas(p);
    if (!igual(v, ids.map((i) => T[i]))) return `con el día «${d || "todos"}» se ven: ${v.join(", ") || "ninguna"}. Tendrían que verse: ${ids.map((i) => T[i]).join(", ")} (usa data-dias y hidden en el <li>)`;
  }
  return true;
});
await comprobar("B", "B1.2", "Filtro: por edad (las de esa edad o menos) y los dos a la vez", () => {
  const p = cartelera();
  const dia = p.querySelector(".filtro__dia");
  const edad = p.querySelector(".filtro__edad");
  const casos = [["", "tp", ["pulpo-jacinta", "mareas-vivas"]], ["", "7", ["luz-caleta", "pulpo-jacinta", "mareas-vivas"]], ["", "12", ["luz-caleta", "pulpo-jacinta", "mareas-vivas", "ultimo-tranvia"]],
    ["vie", "12", ["luz-caleta"]], ["dom", "tp", ["pulpo-jacinta"]], ["sab", "16", ["luz-caleta", "pulpo-jacinta", "levante"]]];
  for (const [d, e, ids] of casos) {
    elegirOpcion(dia, d);
    elegirOpcion(edad, e);
    const v = vistas(p);
    if (!igual(v, ids.map((i) => T[i]))) return `con día «${d || "todos"}» y edad «${e}» se ven: ${v.join(", ") || "ninguna"}. Tendrían que verse: ${ids.map((i) => T[i]).join(", ")}. Ojo: «7» deja ver las TP y las +7; y «tp» no es un número`;
  }
  return true;
});
await comprobar("B", "B1.3", "Filtro: el contador dice cuántas se ven, y «Filtrar» (o Intro) no recarga la página", () => {
  const p = cartelera();
  const dia = p.querySelector(".filtro__dia");
  const edad = p.querySelector(".filtro__edad");
  const cont = () => espacios(p.querySelector(".cartelera__contador")?.textContent);
  for (const [d, e, txt] of [["vie", "", "2 películas"], ["vie", "12", "1 película"], ["vie", "tp", /^Ninguna película/], ["", "", "5 películas"]]) {
    elegirOpcion(dia, d);
    elegirOpcion(edad, e);
    if (txt instanceof RegExp ? !txt.test(cont()) : cont() !== txt) return `con día «${d || "todos"}» y edad «${e || "cualquiera"}» el contador dice «${cont()}» y tendría que decir «${txt instanceof RegExp ? "Ninguna película con ese filtro" : txt}»`;
  }
  const ev = new Event("submit", { bubbles: true, cancelable: true });
  p.querySelector(".filtro").dispatchEvent(ev);
  if (!ev.defaultPrevented) return "al pulsar «Filtrar» la página se recarga: preventDefault() en el submit del formulario (apartado 4.3 de la UD8)";
  return true;
});
const selector = (precio = 5.5) => montar(fn("butacas", "SelectorButacas")({ precio }), fn("butacasI", "activarButacas"));
const butaca = (p, id) => p.querySelector(`[data-butaca="${id}"]`);
const pulsar = (b) => b.dispatchEvent(new MouseEvent("click", { bubbles: true }));
const resumen = (p) => espacios(p.querySelector(".butacas__resumen")?.textContent);
await comprobar("B", "B2.1", "Butacas: al pulsar se elige y al volver a pulsar se suelta (aria-pressed); las ocupadas, nada", () => {
  const p = selector();
  const libres = [...p.querySelectorAll(".butacas__butaca:not([disabled])")];
  if (libres.some((b) => b.getAttribute("aria-pressed") !== "false")) return "al empezar, cada butaca libre con aria-pressed=\"false\": así el lector de pantalla sabe que es un botón que se queda pulsado (apartado 5.1 de la UD8)";
  pulsar(butaca(p, "A3"));
  if (butaca(p, "A3").getAttribute("aria-pressed") !== "true") return "al pulsar A3 tiene que quedarse con aria-pressed=\"true\"";
  pulsar(butaca(p, "A3"));
  if (butaca(p, "A3").getAttribute("aria-pressed") !== "false") return "al pulsar A3 otra vez, se suelta: aria-pressed=\"false\"";
  pulsar(butaca(p, "A1"));
  if (butaca(p, "A1").getAttribute("aria-pressed") === "true") return "A1 está ocupada (disabled): no se puede elegir";
  return true;
});
await comprobar("B", "B2.2", "Butacas: el resumen dice cuáles y cuánto cuesta, y no deja elegir más de 6", () => {
  const p = selector();
  if (resumen(p) !== "Ninguna butaca elegida") return "al empezar, el resumen dice «Ninguna butaca elegida»";
  pulsar(butaca(p, "B2"));
  if (!resumen(p).startsWith("1 butaca:") || !resumen(p).includes("B2") || !resumen(p).includes(euros(5.5))) return `con B2 elegida el resumen dice «${resumen(p)}» y se espera «1 butaca: B2 · ${euros(5.5)}»`;
  pulsar(butaca(p, "B3"));
  if (!resumen(p).startsWith("2 butacas:") || !resumen(p).includes("B2, B3") || !resumen(p).includes(euros(11))) return `con B2 y B3 el resumen dice «${resumen(p)}» y se espera «2 butacas: B2, B3 · ${euros(11)}» (el total con Intl.NumberFormat)`;
  pulsar(butaca(p, "B2"));
  pulsar(butaca(p, "B3"));
  if (resumen(p) !== "Ninguna butaca elegida") return "al soltarlas todas, el resumen vuelve a «Ninguna butaca elegida»";
  const q = selector(4);
  pulsar(butaca(q, "E1"));
  pulsar(butaca(q, "E2"));
  if (!resumen(q).includes(euros(8))) return `con data-precio="4", dos butacas son ${euros(8)}: el precio sale del data-precio del <fieldset>, no escrito a mano`;
  for (const id of ["E3", "E4", "E5", "E6", "E7"]) pulsar(butaca(q, id));
  if (butaca(q, "E7").getAttribute("aria-pressed") === "true") return "se han podido elegir 7 butacas: como mucho 6 por compra";
  if (!/6/.test(resumen(q))) return `al intentar la 7.ª, el resumen tiene que avisar de que son 6 como mucho (dice «${resumen(q)}»)`;
  return true;
});
await comprobar("B", "B2.3", "Butacas: UN solo addEventListener en la sala (delegación), que vale para butacas nuevas", () => {
  const html = fn("butacas", "SelectorButacas")();
  const caja = document.createElement("div");
  caja.innerHTML = html;
  document.body.replaceChildren(caja);
  const original = ventana.EventTarget.prototype.addEventListener;
  let enButacas = 0;
  ventana.EventTarget.prototype.addEventListener = function (...a) {
    if (this.classList?.contains("butacas__butaca")) enButacas++;
    return original.apply(this, a);
  };
  try {
    fn("butacasI", "activarButacas")(caja);
  } finally {
    ventana.EventTarget.prototype.addEventListener = original;
  }
  if (enButacas > 0) return `hay ${enButacas} addEventListener, uno en cada butaca: pon UNO en .butacas__sala y busca la butaca con evento.target.closest(…) (apartado 5 de la UD8)`;
  const nueva = document.createElement("button");
  nueva.type = "button";
  nueva.className = "butacas__butaca";
  nueva.dataset.butaca = "G1";
  nueva.textContent = "G1";
  nueva.setAttribute("aria-pressed", "false");
  caja.querySelector(".butacas__fila").append(nueva);
  pulsar(nueva);
  if (nueva.getAttribute("aria-pressed") !== "true") return "una butaca añadida después no responde: con delegación, sí lo haría";
  return true;
});
const compra = () => {
  const P = fn("compra", "PaginaCompra");
  return montar(P(), fn("butacasI", "activarButacas"), fn("compraI", "activarCompra"));
};
const enviar = (f) => {
  const ev = new Event("submit", { bubbles: true, cancelable: true });
  f.dispatchEvent(ev);
  return ev;
};
const escribir = (campo, texto) => {
  campo.value = texto;
  campo.dispatchEvent(new Event("input", { bubbles: true }));
};
const error = (p, id) => p.querySelector(`#${id}-error`);
await comprobar("B", "B3.1", "Compra: enviar vacío no recarga, enseña los errores (también el de las butacas) y lleva el foco", () => {
  const p = compra();
  const f = p.querySelector(".compra-form");
  const ev = enviar(f);
  if (!ev.defaultPrevented) return "al enviar, la página se recarga: preventDefault() (apartado 6.3 de la UD8)";
  for (const id of ["compra-nombre", "compra-correo", "compra-acepto"]) {
    if (error(p, id)?.hidden !== false || !espacios(error(p, id)?.textContent)) return `al enviar vacío no se ve el error de #${id} (quita hidden y pon el texto)`;
    if (p.querySelector(`#${id}`).getAttribute("aria-invalid") !== "true") return `#${id} mal: aria-invalid="true" (apartado 6.4 de la UD8)`;
  }
  if (error(p, "compra-telefono")?.hidden === false) return "el teléfono no es obligatorio: vacío no da error";
  const eb = p.querySelector(".butacas__error");
  if (eb?.hidden !== false || !/butaca/i.test(eb.textContent)) return "sin butacas elegidas, enseña el error de .butacas__error («Elige al menos una butaca.»)";
  if (document.activeElement !== butaca(p, "A3")) return "el foco va a lo primero que está mal: sin butacas, a la primera butaca libre (la A3)";
  const q = compra();
  pulsar(butaca(q, "B1"));
  enviar(q.querySelector(".compra-form"));
  if (document.activeElement !== q.querySelector("#compra-nombre")) return "con una butaca elegida y el formulario vacío, el foco va al primer campo mal (el nombre)";
  if (q.querySelector(".butacas__error")?.hidden === false) return "con una butaca elegida no tiene que salir el error de las butacas";
  return true;
});
await comprobar("B", "B3.2", "Compra: cada fallo con su mensaje (correo sin @, teléfono que no son 9 cifras)", () => {
  const p = compra();
  const f = p.querySelector(".compra-form");
  enviar(f);
  const vacio = espacios(error(p, "compra-nombre").textContent);
  escribir(f.elements.correo, "ana");
  escribir(f.elements.telefono, "12345");
  enviar(f);
  const correo = espacios(error(p, "compra-correo").textContent);
  const tel = espacios(error(p, "compra-telefono").textContent);
  if (!correo.includes("@")) return `con el correo «ana» el mensaje dice «${correo}»: explica cómo es un correo, con un ejemplo (ana@correo.es)`;
  if (error(p, "compra-telefono").hidden || !/9 cifras/.test(tel)) return `con el teléfono «12345» el mensaje tiene que decir que son 9 cifras (dice «${tel}»)`;
  if (vacio === correo || vacio === tel) return "el mismo mensaje para todo no ayuda: uno para cada fallo (validity.valueMissing, typeMismatch, patternMismatch)";
  return true;
});
await comprobar("B", "B3.3", "Compra: con todo bien, dice qué has comprado (butacas, total y correo) y vacía el formulario", () => {
  const p = compra();
  const f = p.querySelector(".compra-form");
  pulsar(butaca(p, "A3"));
  pulsar(butaca(p, "A4"));
  escribir(f.elements.nombre, "Ana <b>Gil</b>");
  escribir(f.elements.correo, "ana@correo.es");
  f.elements.acepto.checked = true;
  f.elements.acepto.dispatchEvent(new Event("input", { bubbles: true }));
  enviar(f);
  const ok = f.querySelector(".compra-form__ok");
  const t = espacios(ok?.textContent);
  if (!ok || ok.hidden) return "con todo bien no se ve .compra-form__ok: quita su hidden";
  for (const [x, que] of [["Ana", "el nombre"], ["2 entradas", "cuántas entradas («2 entradas»)"], [PELI.titulo, "la película (data-pelicula del formulario)"], ["A3, A4", "las butacas"], [euros(11), "el total"], ["ana@correo.es", "el correo"]]) {
    if (!t.includes(x)) return `el mensaje dice «${t}» y le falta ${que}`;
  }
  if (ok.querySelector("b")) return "el nombre que escribe la persona se ha convertido en HTML: con innerHTML, cualquiera puede meter código en tu página. Usa textContent";
  if (!t.includes("<b>Gil</b>")) return "el nombre tiene que salir tal como lo escribió la persona (textContent)";
  if (f.elements.nombre.value !== "") return "después de comprar, el formulario se vacía (reset())";
  if ([...f.querySelectorAll(".campo__error")].some((e) => !e.hidden)) return "con todo bien no tiene que quedar ningún error a la vista";
  return true;
});
await comprobar("B", "B3.4", "Compra: el error se quita en cuanto se corrige, sin volver a enviar", () => {
  const p = compra();
  const f = p.querySelector(".compra-form");
  enviar(f);
  if (error(p, "compra-correo")?.hidden !== false) return "primero el B3.1: al enviar vacío tiene que verse el error del correo";
  escribir(f.elements.correo, "ana@correo.es");
  if (!error(p, "compra-correo").hidden) return "al escribir un correo bien, su error sigue a la vista: escucha input en el formulario y vuelve a revisar ese campo";
  if (f.elements.correo.hasAttribute("aria-invalid")) return "al corregirlo, quita también aria-invalid";
  return true;
});
const trailer = (n = 1) => {
  const T = fn("trailer", "Trailer");
  const html = n === 1 ? T() : T({ titulo: "Uno", webm: "/a.webm", mp4: "/a.mp4", vtt: "/a.vtt" }) + T({ titulo: "Dos", webm: "/b.webm", mp4: "/b.mp4", vtt: "/b.vtt" });
  return montar(html, fn("trailerI", "activarTrailer"));
};
await comprobar("B", "B4.1", "Tráiler: al pulsar, un <video controls> con WebM, MP4 y subtítulos, sin autoplay", async () => {
  const p = trailer();
  const b = p.querySelector(".trailer__boton");
  if (p.querySelector("video")) return "el vídeo no tiene que estar antes de pulsar: se crea cuando alguien lo pide";
  pulsar(b);
  await espera();
  const v = p.querySelector("video");
  if (!v) return "al pulsar «Ver el tráiler» no aparece ningún <video> (document.createElement, apartado 7 de la UD8)";
  if (b.nextElementSibling !== v) return "el vídeo va justo después del botón (boton.after(video))";
  if (!v.hasAttribute("controls")) return "el vídeo sin controls: no se puede parar ni quitar el sonido";
  if (v.hasAttribute("autoplay")) return "nada de autoplay: el vídeo empieza porque la persona lo ha pedido (play() al pulsar)";
  if (!b.hidden) return "el botón ya no hace falta: escóndelo (hidden)";
  const s = [...v.querySelectorAll("source")];
  const d = p.querySelector(".trailer").dataset;
  if (s.length !== 2 || s[0].getAttribute("src") !== d.webm || s[0].getAttribute("type") !== "video/webm" || s[1].getAttribute("src") !== d.mp4 || s[1].getAttribute("type") !== "video/mp4")
    return "dos <source>: primero el WebM (type=\"video/webm\") y después el MP4 (type=\"video/mp4\"), con las rutas de dataset";
  const tr = v.querySelector("track");
  if (!tr || !/subtitles|captions/.test(tr.getAttribute("kind") ?? "") || tr.getAttribute("src") !== d.vtt || tr.getAttribute("srclang") !== "es" || !tr.getAttribute("label"))
    return "faltan los subtítulos: <track kind=\"subtitles\" src=\"(el .vtt de dataset)\" srclang=\"es\" label=\"Español\"> (apartado 6.3 de la UD6)";
  if (!v.querySelector(`a[href="${d.mp4}"]`)) return "dentro del <video>, un enlace para descargar el MP4 por si el navegador no lo reproduce";
  return true;
});
await comprobar("B", "B4.2", "Tráiler: suena al pulsar (play con .catch), se crea una sola vez y cada botón pone el suyo", async () => {
  reproducciones = 0;
  const p = trailer();
  const b = p.querySelector(".trailer__boton");
  pulsar(b);
  await espera();
  if (reproducciones !== 1) return "al pulsar hay que llamar a video.play(): la persona ya lo ha pedido";
  pulsar(b);
  await espera();
  if (p.querySelectorAll("video").length !== 1) return "al pulsar dos veces salen dos vídeos: { once: true } en el addEventListener";
  playFalla = true;
  sinCatch = 0;
  const q = trailer();
  pulsar(q.querySelector(".trailer__boton"));
  await espera();
  playFalla = false;
  if (sinCatch) return "si el navegador no deja reproducir, play() falla y sale un error sin capturar: video.play().catch(() => {})";
  const r = trailer(2);
  const [b1, b2] = r.querySelectorAll(".trailer__boton");
  pulsar(b2);
  await espera();
  const vs = r.querySelectorAll("video");
  if (vs.length !== 1 || vs[0].querySelector("source")?.getAttribute("src") !== "/b.webm") return "con dos tráileres, cada botón pone SU vídeo (recorre todos los .trailer y usa el dataset de cada uno)";
  void b1;
  return true;
});
const MOTORES = [[/chrome|edge|opera|brave|chromium/, "Blink"], [/firefox/, "Gecko"], [/safari/, "WebKit"]];
await comprobar("B", "B4.3", "navegadores.md: lo has probado en dos motores, con el teclado y a 360 px", () => {
  const t = leer("navegadores.md");
  if (!t) return "no encuentro navegadores.md";
  const lineas = t.split("\n").filter((l) => l.trim().startsWith("|"));
  if (lineas.length < 3) return "no encuentro la tabla de navegadores.md: no cambies sus títulos";
  const cab = lineas[0].split("|").slice(1, -1).map((x) => sinTildes(x));
  const motores = new Set(cab.slice(1).flatMap((h) => MOTORES.filter(([re]) => re.test(h)).map(([, m]) => m)));
  if (motores.size < 2) return `las columnas son: ${cab.slice(1).join(", ") || "(ninguna)"}. Hacen falta dos navegadores de motor distinto: Chrome y Edge son el mismo (Blink); usa Firefox`;
  const filas = lineas.slice(2).map((l) => l.split("|").slice(1, -1).map((x) => x.trim())).filter((f) => f[0]);
  const completas = filas.filter((f) => f.slice(1).every((x) => x && !/^[(…]/.test(x)));
  if (completas.length < 6) return `hay ${completas.length} fila(s) completas: rellena las 6 (cada casilla, «sí», «no» o lo que pasa)`;
  const todo = sinTildes(completas.map((f) => f[0]).join(" "));
  if (!/teclado/.test(todo) || !/360/.test(todo)) return "las filas del teclado y de los 360 px tienen que estar rellenas";
  return true;
});

// 👀 La prueba de interacción que viene hecha (no cuenta): pasa cuando el ✍️ B2 funciona
await comprobar("B", "👀", "👀 La prueba de Storybook «Elige dos butacas» (viene hecha: pasa con el ✍️ B2)", async () => {
  const H = historias("butacasH");
  const h = H.lista.find(([n]) => n === "EligeDosButacas")?.[1];
  if (!h?.play) return "falta la historia EligeDosButacas: vuelve a copiarla del kit";
  const lienzo = document.createElement("div");
  const r = H.meta.render({ ...H.meta.args });
  if (typeof r === "string") lienzo.innerHTML = r;
  else lienzo.append(r);
  document.body.replaceChildren(lienzo);
  try {
    await h.play({ canvasElement: lienzo, args: {}, step: async (_n, f) => f() });
    return true;
  } catch (e) {
    return `falla: ${espacios(e.message).slice(0, 140)}`;
  }
});

// ───────────── el informe ─────────────
const cuentan = resultados.filter((r) => r.cuenta);
const bien = cuentan.filter((r) => r.ok).length;
if (JSON_OUT) {
  console.log(JSON.stringify({ bien, total: cuentan.length, resultados }, null, 2));
} else {
  const NOMBRES = { A: "Componentes y catálogo (UD7)", B: "Interactividad (UD8)" };
  console.log(c(1, "\n🎬 P3 · Cine Bahía\n"));
  let actual = null;
  for (const r of resultados) {
    if (r.bloque !== actual) {
      actual = r.bloque;
      console.log(c(1, `Bloque ${r.bloque} · ${NOMBRES[r.bloque]}`));
    }
    const marca = r.ok ? c(32, "✔") : r.cuenta ? c(31, "✘") : c(33, "•");
    console.log(`  ${marca} ${r.id === "👀" ? "" : r.id + " · "}${r.texto}`);
    if (!r.ok) console.log(c(2, `      💡 ${r.pista}`));
  }
  const total = cuentan.length;
  console.log(c(1, `\n${bien === total ? "🎉 " : ""}${bien} de ${total} comprobaciones en verde${SOLO ? ` (bloque ${SOLO})` : ""}\n`));
  if (!SOLO) console.log(c(2, "Y la calidad: npm run lint y npm run formato:comprobar, sin errores.\n"));
}
process.exitCode = 0;
setTimeout(() => process.exit(0), 50); // happy-dom deja temporizadores abiertos
