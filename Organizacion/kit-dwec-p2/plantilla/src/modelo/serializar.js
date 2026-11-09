// serializar.js — Bloque C · 👀 fechaATexto y aDatos (RESUELTOS) · ✍️ C1 desdeDatos.
// De clases a datos (para JSON) y de vuelta. Está en modelo/: no toca ni la página ni el almacenamiento.
import { Tarea } from "./Tarea.js";
import { TareaRecurrente } from "./TareaRecurrente.js";

const dos = (n) => String(n).padStart(2, "0");

/** Date → "AAAA-MM-DD" en hora LOCAL (toISOString usa UTC y en España puede dar el día anterior) */
// 👀 Resuelto
export function fechaATexto(fecha) {
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
}

// 👀 Resuelto
/** Tarea → objeto plano que JSON entiende. Las recurrentes llevan además cadaDias. */
export function aDatos(tarea) {
  const datos = {
    id: tarea.id,
    titulo: tarea.titulo,
    prioridad: tarea.prioridad,
    limite: tarea.limite ? fechaATexto(tarea.limite) : null,
  };
  if (tarea instanceof TareaRecurrente) datos.cadaDias = tarea.cadaDias;
  return datos;
}

// ✍️ C1 · desdeDatos(datos) → lo contrario de aDatos: TareaRecurrente si trae cadaDias, Tarea si no
//   (cada campo a su sitio en el constructor, también el id)
export function desdeDatos(datos) {
  throw new Error("Sin hacer");
}
