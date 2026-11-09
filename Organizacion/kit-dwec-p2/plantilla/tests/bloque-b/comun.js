// comun.js — ayudas de los tests del bloque B (no es un test).
import { Tablero } from "../../src/modelo/Tablero.js";
import { iniciarApp } from "../../src/ui/app.js";
import { cargarPagina } from "../pagina.js";

export const HOY = new Date(2026, 10, 6); // viernes 06/11/2026
export const DATOS = [
  { titulo: "Diseñar la base de datos", prioridad: "alta", limite: "2026-11-01" },
  { titulo: "Escribir el README" },
  { titulo: "Copia de seguridad", limite: "2026-11-09", cadaDias: 7 },
  { titulo: "Revisar el CSS", prioridad: "baja" },
];

/** Monta la página con un tablero nuevo. Devuelve { raiz, tablero, cambios } */
export function montar({ limite = 2, datos = DATOS } = {}) {
  const raiz = cargarPagina();
  const tablero = Tablero.desde(datos, limite);
  const cambios = [];
  iniciarApp(raiz, tablero, { hoy: HOY, alCambiar: (t) => cambios.push(t) });
  return { raiz, tablero, cambios };
}

export const $ = (selector) => document.querySelector(selector);
export const lista = (columna) => $(`[data-columna="${columna}"] .lista`);
export const titulos = (columna) =>
  [...lista(columna).querySelectorAll(".tarjeta h3")].map((h) => h.textContent);
export const tarjeta = (titulo) =>
  [...document.querySelectorAll(".tarjeta")].find(
    (t) => t.querySelector("h3").textContent === titulo,
  );
export const pulsar = (titulo, accion) =>
  tarjeta(titulo).querySelector(`button[data-accion="${accion}"]`).click();
