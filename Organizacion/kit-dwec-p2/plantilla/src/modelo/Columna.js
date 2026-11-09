// Columna.js — Bloque A · ✍️ A2: una columna del tablero («Por hacer», «En curso», «Hecho»).
// En kanban, una columna puede tener un límite WIP (Work In Progress): «En curso» no admite más
// de 3 tareas a la vez, para no empezar mil cosas y no acabar ninguna.
import { Tarea } from "./Tarea.js";

export class Columna {
  // Privado: #tareas, un array

  constructor(nombre, limiteWip = null) {
    // 1 · nombre: texto no vacío (sin espacios a los lados) → si no, TypeError
    //     limiteWip: null (sin límite) o un entero ≥ 1 → si no, RangeError
    throw new Error("Sin hacer");
  }

  // 2 · get llena: true si hay límite y ya hay tantas tareas como el límite

  // 3 · get tareas: una COPIA del array (que nadie pueda tocar el tuyo desde fuera)

  // 4 · añadir(tarea): TypeError si no es instanceof Tarea · Error («… está llena …») si está
  //     llena · si no, la guarda y la devuelve

  // 5 · quitar(id): la saca del array y la devuelve · Error («… no está …») si no la encuentra
  //     Pista: findIndex + splice
  // 6 · tiene(id): true / false. Pista: some

  // 7 · ordenadas(): un array NUEVO ordenado: primero prioridad alta (usa t.peso), y a igual
  //     prioridad, el límite más cercano; las que no tienen límite, al final.
  //     Pista: [...this.#tareas].sort((a, b) => …) — ¿por qué la copia?
}

// Comprueba con:  docker compose run --rm web npm test 3-columna
void Tarea; // (borra esta línea cuando uses Tarea)
