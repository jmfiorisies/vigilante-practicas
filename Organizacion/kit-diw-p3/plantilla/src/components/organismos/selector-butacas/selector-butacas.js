// selector-butacas.js — 👀 ya está hecho. El organismo Selector de butacas: la sala, fila a fila.
// Cada butaca es un <button> (se llega con el teclado y se pulsa con Intro o Espacio). Las vendidas, desactivadas.
// Lo que pasa al pulsar lo escribes en selector-butacas.interaccion.js (✍️ B2).
import { sala as SALA } from "../../../datos/cartelera.js";

export function SelectorButacas({ sala = SALA, precio = 5.5 } = {}) {
  const filas = sala.filas
    .map((fila) => {
      const butacas = Array.from({ length: sala.porFila }, (_, i) => {
        const id = `${fila}${i + 1}`;
        return sala.ocupadas.includes(id)
          ? `<button type="button" class="butacas__butaca butacas__butaca--ocupada" data-butaca="${id}" disabled>${id}<span class="visualmente-oculto"> (ocupada)</span></button>`
          : `<button type="button" class="butacas__butaca" data-butaca="${id}">${id}</button>`;
      }).join("");
      return `<div class="butacas__fila" role="group" aria-label="Fila ${fila}">${butacas}</div>`;
    })
    .join("\n    ");
  return `<fieldset class="butacas" data-precio="${precio}">
  <legend class="butacas__titulo">Elige tus butacas (6 como máximo)</legend>
  <p class="butacas__pantalla" aria-hidden="true">Pantalla</p>
  <div class="butacas__sala">
    ${filas}
  </div>
  <p class="butacas__resumen" role="status">Ninguna butaca elegida</p>
  <p class="butacas__error" id="butacas-error" hidden></p>
</fieldset>`;
}
