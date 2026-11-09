// main.js — Arranca la página. El modelo (src/modelo/) NUNCA toca el DOM ni el almacenamiento.
// No hace falta que lo cambies: mientras no tengas el bloque C (iniciar), la página arranca con
// unas tareas de ejemplo y no recuerda nada al recargar.
import { iniciar } from "./arranque.js";
import { Tablero } from "./modelo/Tablero.js";
import { iniciarApp } from "./ui/app.js";

const raiz = document.querySelector("#app");
const EJEMPLO = [
  { titulo: "Diseñar el modelo", prioridad: "alta", limite: "2026-11-13" },
  { titulo: "Escribir el README" },
  { titulo: "Copia de seguridad", limite: "2026-11-09", cadaDias: 7 },
];

iniciar(raiz).catch((error) => {
  if (error.message !== "Sin hacer") throw error;
  raiz.querySelector("#estado").hidden = true;
  iniciarApp(raiz, Tablero.desde(EJEMPLO, 3));
});
