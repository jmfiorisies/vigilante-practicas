// pagina.js — carga el <body> de index.html en el DOM de prueba (happy-dom). No es un test.
import { readFileSync } from "node:fs";

// Ruta relativa a la carpeta del proyecto (Vitest se lanza desde ahí)
const html = readFileSync("index.html", "utf8");
const cuerpo = html.slice(html.indexOf("<body>") + 6, html.indexOf("</body>"));

export function cargarPagina() {
  document.body.innerHTML = cuerpo.replace(/<script[\s\S]*?<\/script>/g, "");
  return document.querySelector("#app");
}
