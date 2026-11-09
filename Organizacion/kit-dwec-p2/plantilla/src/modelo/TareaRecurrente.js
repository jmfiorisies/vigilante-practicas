// TareaRecurrente.js — Bloque A · ✍️ A1: herencia.
// Una tarea recurrente ES UNA Tarea que se repite cada N días (sacar la basura, la copia de
// seguridad…). Cuando se completa, aparece otra igual con el límite N días más tarde.
import { Tarea } from "./Tarea.js";

// 1 · Haz que herede de Tarea (una palabra antes de la llave)
export class TareaRecurrente {
  // new TareaRecurrente("Sacar la basura", "media", "2026-10-23", 7): lo mismo que una Tarea + cadaDias
  // (Bloque C · ✍️ C3: añadirás un quinto parámetro, id = null, y se lo pasarás también al super)
  constructor(titulo, prioridad, limite, cadaDias) {
    // 2 · Llama al constructor del padre (super) con lo que es de Tarea, ANTES de usar this.
    // 3 · cadaDias tiene que ser un entero ≥ 1 → si no, RangeError.
    //     Pista: Number.isInteger
    // 4 · Una recurrente sin límite no tiene sentido → si this.limite es null, TypeError.
    // 5 · Guarda this.cadaDias.
    throw new Error("Sin hacer");
  }

  // 6 · siguiente(): devuelve una TareaRecurrente NUEVA con el mismo título, prioridad y cadaDias,
  //     y el límite cadaDias días después. ⚠️ Sin tocar this.limite: copia la fecha primero.
  //     Pista: const limite = new Date(this.limite); limite.setDate(limite.getDate() + …)

  // 7 · Sobrescribe alCompletar(): en vez de [], devuelve [la siguiente].

  // 8 · Sobrescribe toString(): lo del padre + " · 🔁 cada N días".
}

// Comprueba con:  docker compose run --rm web npm test 2-recurrente
void Tarea; // (borra esta línea cuando uses Tarea)
