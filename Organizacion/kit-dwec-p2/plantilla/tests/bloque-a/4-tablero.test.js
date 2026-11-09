import { describe, expect, test } from "vitest";
import { Columna } from "../../src/modelo/Columna.js";
import { Tablero } from "../../src/modelo/Tablero.js";
import { Tarea } from "../../src/modelo/Tarea.js";
import { TareaRecurrente } from "../../src/modelo/TareaRecurrente.js";

const DATOS = [
  { titulo: "Diseñar la base de datos", prioridad: "alta", limite: "2026-10-20" },
  { titulo: "Escribir el README" },
  { titulo: "Copia de seguridad", limite: "2026-10-23", cadaDias: 7 },
  { titulo: "Revisar el CSS", prioridad: "baja" },
];
const nuevo = () => Tablero.desde(DATOS, 2);
const id = (tablero, titulo) =>
  tablero.columna("Por hacer").tareas.find((t) => t.titulo === titulo).id;

describe("✍️ A3 · Tablero (TIENE columnas: composición)", () => {
  test("tres columnas fijas; «En curso» con su límite WIP", () => {
    const t = new Tablero(3);
    expect(t.columnas.map((c) => c.nombre)).toEqual(["Por hacer", "En curso", "Hecho"]);
    expect(t.columnas.every((c) => c instanceof Columna)).toBe(true);
    expect(t.columna("En curso").limiteWip).toBe(3);
    expect(() => t.columna("Bloqueado")).toThrow(/Bloqueado/);
    expect(Object.getPrototypeOf(Tablero)).toBe(Function.prototype);
  });

  test("static desde(): todas a «Por hacer», recurrente si trae cadaDias", () => {
    const t = nuevo();
    const porHacer = t.columna("Por hacer").tareas;
    expect(porHacer).toHaveLength(4);
    expect(porHacer[2]).toBeInstanceOf(TareaRecurrente);
    expect(porHacer[0]).toBeInstanceOf(Tarea);
    expect(porHacer[0]).not.toBeInstanceOf(TareaRecurrente);
  });

  test("buscar(id) en cualquier columna, o null", () => {
    const t = nuevo();
    const readme = id(t, "Escribir el README");
    t.mover(readme, "En curso");
    expect(t.buscar(readme).titulo).toBe("Escribir el README");
    expect(t.buscar(9999)).toBeNull();
  });

  test("mover(id, destino) la cambia de columna", () => {
    const t = nuevo();
    const bd = id(t, "Diseñar la base de datos");
    t.mover(bd, "En curso");
    expect(t.columna("En curso").tiene(bd)).toBe(true);
    expect(t.columna("Por hacer").tiene(bd)).toBe(false);
    expect(t.dondeEsta(bd).nombre).toBe("En curso");
  });

  test("mover a una columna llena lanza y la tarea se queda donde estaba", () => {
    const t = nuevo(); // «En curso» admite 2
    t.mover(id(t, "Diseñar la base de datos"), "En curso");
    t.mover(id(t, "Escribir el README"), "En curso");
    const css = id(t, "Revisar el CSS");
    expect(() => t.mover(css, "En curso")).toThrow(/llena/i);
    expect(t.columna("Por hacer").tiene(css)).toBe(true);
  });

  test("mover una tarea que no existe, o a una columna que no existe, lanza", () => {
    const t = nuevo();
    expect(() => t.mover(9999, "Hecho")).toThrow(/9999/);
    const css = id(t, "Revisar el CSS");
    expect(() => t.mover(css, "Archivo")).toThrow(/Archivo/);
    expect(t.columna("Por hacer").tiene(css)).toBe(true);
  });

  test("completar una normal: a «Hecho» y nada más", () => {
    const t = nuevo();
    t.completar(id(t, "Escribir el README"));
    expect(t.columna("Hecho").tareas).toHaveLength(1);
    expect(t.columna("Por hacer").tareas).toHaveLength(3);
  });

  test("completar una recurrente: a «Hecho» y aparece la siguiente en «Por hacer» (polimorfismo)", () => {
    const t = nuevo();
    t.completar(id(t, "Copia de seguridad"));
    const nueva = t.columna("Por hacer").tareas.find((x) => x.titulo === "Copia de seguridad");
    expect(nueva).toBeInstanceOf(TareaRecurrente);
    expect(nueva.limite.getDate()).toBe(30);
    expect(t.columna("Hecho").tareas[0].limite.getDate()).toBe(23);
  });

  test("resumen(hoy): cuántas hay en cada columna y cuántas vencidas (sin contar las hechas)", () => {
    const t = nuevo();
    t.mover(id(t, "Escribir el README"), "En curso");
    expect(t.resumen(new Date(2026, 9, 24))).toEqual({
      porHacer: 3,
      enCurso: 1,
      hecho: 0,
      vencidas: 2,
    });
    t.completar(id(t, "Diseñar la base de datos"));
    expect(t.resumen(new Date(2026, 9, 24))).toEqual({
      porHacer: 2,
      enCurso: 1,
      hecho: 1,
      vencidas: 1,
    });
  });
});
