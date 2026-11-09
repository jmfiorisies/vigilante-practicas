// Tarea.js — Bloque A · 👀 EJEMPLO RESUELTO.
// Léelo entero antes de seguir: los demás ficheros se parecen a este. Fíjate en:
//   · static            → las prioridades y el contador de ids son de la CLASE, no de cada tarea
//   · #privado          → nadie de fuera puede poner una prioridad inventada
//   · get / set         → el título y la prioridad se validan SIEMPRE, también al crear
//   · Date              → la fecha límite, leída en hora local (mira parsearFecha en fechas.js)
//   · alCompletar()     → devuelve [] aquí; las subclases pueden cambiarlo (polimorfismo)
import { formatear, parsearFecha, soloDia } from "./fechas.js";

export class Tarea {
  static PRIORIDADES = Object.freeze(["baja", "media", "alta"]);
  static #siguienteId = 1;

  #titulo;
  #prioridad;

  // new Tarea("Preparar la demo", "alta", "2026-11-05") · new Tarea("Escribir el README")
  // Los parámetros con = tienen valor por defecto: si no los pasas, prioridad "media" y sin límite.
  // (Bloque C · ✍️ C3: aquí añadirás un cuarto parámetro, el id, para recuperar las tareas guardadas)
  constructor(titulo, prioridad = "media", limite = null) {
    this.id = Tarea.#siguienteId++;
    this.titulo = titulo; // pasa por el setter: se valida también al crear
    this.prioridad = prioridad;
    this.limite = limite === null ? null : parsearFecha(limite);
    this.creada = new Date();
  }

  get titulo() {
    return this.#titulo;
  }

  set titulo(valor) {
    if (typeof valor !== "string" || valor.trim() === "")
      throw new TypeError("La tarea necesita un título");
    if (valor.trim().length > 80) throw new RangeError("El título no puede pasar de 80 caracteres");
    this.#titulo = valor.trim();
  }

  get prioridad() {
    return this.#prioridad;
  }

  set prioridad(valor) {
    if (!Tarea.PRIORIDADES.includes(valor)) throw new RangeError(`Prioridad desconocida: ${valor}`);
    this.#prioridad = valor;
  }

  /** 0 = baja, 1 = media, 2 = alta (para ordenar) */
  get peso() {
    return Tarea.PRIORIDADES.indexOf(this.#prioridad);
  }

  bajarPrioridad() {
    if (this.peso === 0) return false; // ya es la más baja: no hace nada
    this.#prioridad = Tarea.PRIORIDADES[this.peso - 1];
    return true;
  }

  /** ¿Se ha pasado la fecha límite? `hoy` se puede pasar para probar (por defecto, hoy) */
  estaVencida(hoy = new Date()) {
    return this.limite !== null && this.limite < soloDia(hoy);
  }

  /** Lo que pasa al completarla. Una tarea normal no genera nada más. */
  alCompletar() {
    return [];
  }

  toString() {
    const limite = this.limite ? ` · límite ${formatear(this.limite)}` : "";
    return `#${this.id} [${this.#prioridad}] ${this.#titulo}${limite}`;
  }
}
