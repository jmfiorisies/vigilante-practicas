// comun.js — datos y ayudas que comparten los tests del bloque A (no es un test).
import { Tablero } from "../../src/modelo/Tablero.js";

export const DATOS = [
  { titulo: "Diseñar la base de datos", prioridad: "alta", limite: "2026-10-20" },
  { titulo: "Escribir el README" },
  { titulo: "Copia de seguridad", limite: "2026-10-23", cadaDias: 7 },
  { titulo: "Revisar el CSS", prioridad: "baja", limite: "2026-10-28" },
  { titulo: "Preparar la demo", prioridad: "alta", limite: "2026-11-05" },
];
export const nuevo = (limiteEnCurso = 2) => Tablero.desde(DATOS, limiteEnCurso);
/** id de la tarea con ese título, esté donde esté (la primera que encuentre) */
export const id = (tablero, titulo) =>
  tablero.columnas.flatMap((c) => c.tareas).find((t) => t.titulo === titulo).id;
/** títulos de una columna, en el orden guardado */
export const titulos = (tablero, columna) => tablero.columna(columna).tareas.map((t) => t.titulo);
