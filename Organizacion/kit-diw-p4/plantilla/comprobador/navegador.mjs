// navegador.mjs — 👀 un navegador de mentira (happy-dom) con axe dentro. Lo usan auditar.mjs y comprobar.mjs.
// happy-dom construye el DOM y ejecuta el JavaScript, pero NO dibuja: no sabe de colores, tamaños ni movimiento.
// Pinta cada página con el <body> de su .html y la activa con su módulo de src/paginas/ (como hace Vite al abrirla).
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { Window } from "happy-dom";

export const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
export const leer = (f) => readFileSync(join(RAIZ, f), "utf8");
const requerir = createRequire(import.meta.url);

// Sin red: ni los ficheros externos ni las imágenes se cargan
export const ventana = new Window({
  url: "http://localhost:5191/",
  settings: { disableIframePageLoading: true, disableJavaScriptFileLoading: true, disableCSSFileLoading: true, navigation: { disableChildFrameNavigation: true } },
});
for (const k of ["window", "document", "navigator", "HTMLElement", "Element", "Node", "Event", "MouseEvent", "KeyboardEvent",
  "InputEvent", "FocusEvent", "PointerEvent", "SubmitEvent", "getComputedStyle", "HTMLInputElement", "HTMLButtonElement", "HTMLSelectElement",
  "HTMLFormElement", "DocumentFragment", "MutationObserver", "CustomEvent"]) {
  Object.defineProperty(globalThis, k, { value: k === "window" ? ventana : ventana[k], configurable: true, writable: true });
}
// axe: el mismo motor que Lighthouse y que la pestaña de accesibilidad de las DevTools, con los mensajes en español
ventana.eval(readFileSync(requerir.resolve("axe-core/axe.min.js"), "utf8"));
ventana.axe.configure({ locale: JSON.parse(readFileSync(requerir.resolve("axe-core/locales/es.json"), "utf8")) });
export const REGLAS_WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/** axe sobre lo que haya en el documento: los fallos (violations) y lo que no ha podido decidir (incomplete) */
export async function axe(raiz = document) {
  return ventana.axe.run(raiz, { runOnly: { type: "tag", values: REGLAS_WCAG }, resultTypes: ["violations", "incomplete"] });
}

/** De las etiquetas de axe («wcag412») a los criterios de WCAG («4.1.2») */
export const criterios = (regla) => regla.tags.filter((t) => /^wcag\d{3,}$/.test(t)).map((t) => t.slice(4).split("").join(".").replace(/^(\d)\.(\d)\.(\d)\.(\d)$/, "$1.$2.$3$4"));

/** Carga un módulo (o el error, si no se puede) */
export async function cargar(fichero) {
  try {
    return { m: await import(pathToFileURL(join(RAIZ, fichero)).href) };
  } catch (e) {
    return { error: e.message.split("\n")[0] };
  }
}

/** Las páginas del consultorio: su HTML y el módulo que la activa */
export const PAGINAS = {
  inicio: { titulo: "Inicio", html: "index.html", activa: ["src/paginas/inicio.js", "activarInicio"] },
  cita: { titulo: "Pedir cita", html: "cita.html", activa: ["src/paginas/cita.js", "activarCita"] },
  "mi-cita": { titulo: "Mi cita", html: "mi-cita.html", activa: ["src/paginas/mi-cita.js", "activarMiCita"] },
  accesibilidad: { titulo: "Accesibilidad", html: "accesibilidad.html", activa: null },
};

// Los temporizadores de la página anterior no se cuelan en la siguiente
const temporizadores = new Set();
globalThis.setTimeout = ((original) => (f, ms, ...a) => {
  const id = original(() => {
    temporizadores.delete(id);
    f(...a);
  }, ms);
  temporizadores.add(id);
  return id;
})(setTimeout);

/** Pinta una página en el documento (con el idioma, el título y el <body> de su .html) y la activa */
export async function pintar(clave) {
  for (const t of temporizadores) clearTimeout(t);
  temporizadores.clear();
  const p = PAGINAS[clave];
  const html = leer(p.html);
  const lang = /<html[^>]*\blang="([^"]*)"/i.exec(html)?.[1] ?? "";
  if (lang) document.documentElement.setAttribute("lang", lang);
  else document.documentElement.removeAttribute("lang");
  document.title = /<title>([^<]*)<\/title>/i.exec(html)?.[1] ?? "";
  const cuerpo = /<body[^>]*>([\s\S]*)<\/body>/i.exec(html);
  if (!cuerpo) throw new Error(`${p.html} no tiene <body>`);
  document.body.innerHTML = cuerpo[1].replace(/<script[\s\S]*?<\/script>/gi, "");
  if (p.activa) {
    const act = await cargar(p.activa[0]);
    if (act.error) throw new Error(`no se puede cargar ${p.activa[0]} (${act.error})`);
    if (typeof act.m[p.activa[1]] !== "function") throw new Error(`${p.activa[0]} no exporta la función ${p.activa[1]}`);
    act.m[p.activa[1]](document.body);
  }
  return document.body;
}
