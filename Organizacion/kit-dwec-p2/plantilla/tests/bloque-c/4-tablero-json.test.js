import { describe, expect, test } from "vitest";
import { Tablero } from "../../src/modelo/Tablero.js";
import { Tarea } from "../../src/modelo/Tarea.js";
import { TareaRecurrente } from "../../src/modelo/TareaRecurrente.js";

const DATOS = [
  { titulo: "Diseñar la base de datos", prioridad: "alta", limite: "2026-11-01" },
  { titulo: "Escribir el README" },
  { titulo: "Copia de seguridad", limite: "2026-11-21", cadaDias: 7 },
];
const id = (t, titulo) => t.columnas.flatMap((c) => c.tareas).find((x) => x.titulo === titulo).id;
/** Un tablero con algo en cada columna */
function usado() {
  const t = Tablero.desde(DATOS, 2);
  t.mover(id(t, "Escribir el README"), "En curso");
  t.completar(id(t, "Copia de seguridad")); // genera la siguiente
  return t;
}
const idaYVuelta = (t) => Tablero.desdeJSON(JSON.parse(JSON.stringify(t)));
const foto = (t) => t.columnas.map((c) => c.tareas.map((x) => [x.id, x.titulo]));

describe("✍️ C3 · Tarea con id", () => {
  test("se puede crear con un id y lo conserva", () => {
    expect(new Tarea("A", "media", null, 500).id).toBe(500);
  });

  test("después, las nuevas NO repiten: siguen por encima del mayor", () => {
    new Tarea("A", "media", null, 900);
    expect(new Tarea("B").id).toBeGreaterThan(900);
  });

  test("un id raro lanza RangeError", () => {
    expect(() => new Tarea("A", "media", null, 0)).toThrow(RangeError);
    expect(() => new Tarea("A", "media", null, "7")).toThrow(RangeError);
  });

  test("las recurrentes también (pasa por super)", () => {
    const r = new TareaRecurrente("R", "media", "2026-11-21", 7, 950);
    expect(r.id).toBe(950);
  });
});

describe("✍️ C4 · toJSON y desdeJSON", () => {
  test("JSON.stringify(tablero) ya no da {}: version, limiteEnCurso y columnas", () => {
    const datos = JSON.parse(JSON.stringify(usado()));
    expect(datos.version).toBe(1);
    expect(datos.limiteEnCurso).toBe(2);
    expect(Object.keys(datos.columnas)).toEqual(["Por hacer", "En curso", "Hecho"]);
    expect(datos.columnas["En curso"][0]).toMatchObject({
      titulo: "Escribir el README",
      limite: null,
    });
  });

  test("ida y vuelta: las mismas tareas, en las mismas columnas, con los MISMOS ids", () => {
    const t = usado();
    expect(foto(idaYVuelta(t))).toEqual(foto(t));
  });

  test("las recurrentes vuelven a ser TareaRecurrente y las fechas, Date", () => {
    const copia = idaYVuelta(usado());
    const recurrente = copia.columna("Hecho").tareas[0];
    expect(recurrente).toBeInstanceOf(TareaRecurrente);
    expect(recurrente.limite).toBeInstanceOf(Date);
  });

  test("el límite WIP se conserva", () => {
    const copia = idaYVuelta(usado());
    expect(copia.columna("En curso").limiteWip).toBe(2);
  });

  test("el tablero recuperado funciona: sus reglas y sus columnas son las de un Tablero", () => {
    const copia = idaYVuelta(usado());
    copia.completar(id(copia, "Escribir el README"));
    expect(copia.columna("Hecho").tareas.map((x) => x.titulo)).toEqual([
      "Copia de seguridad",
      "Escribir el README",
    ]);
    expect(() => copia.mover(id(copia, "Escribir el README"), "Por hacer")).toThrow();
  });

  test("una tarea nueva después de recuperar no repite id", () => {
    const t = usado();
    const ids = t.columnas.flatMap((c) => c.tareas).map((x) => x.id);
    const nueva = idaYVuelta(t).crearTarea({ titulo: "Nueva" });
    expect(ids).not.toContain(nueva.id);
  });

  test("datos de otra versión o sin versión: lanza un Error", () => {
    const datos = JSON.parse(JSON.stringify(usado()));
    expect(() => Tablero.desdeJSON({ ...datos, version: 2 })).toThrow();
    expect(() => Tablero.desdeJSON({ columnas: {} })).toThrow();
    expect(() => Tablero.desdeJSON(null)).toThrow();
  });
});
