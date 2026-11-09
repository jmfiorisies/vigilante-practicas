import { describe, expect, test } from "vitest";
import { Columna } from "../../src/modelo/Columna.js";
import { Tarea } from "../../src/modelo/Tarea.js";

const tarea = (titulo, prioridad = "media", limite = null) => new Tarea(titulo, prioridad, limite);

describe("✍️ A2 · Columna", () => {
  test("se crea con nombre y, si quieres, un límite WIP", () => {
    const c = new Columna(" En curso ", 3);
    expect(c.nombre).toBe("En curso");
    expect(c.limiteWip).toBe(3);
    expect(new Columna("Por hacer").limiteWip).toBeNull();
    expect(() => new Columna("")).toThrow(TypeError);
    expect(() => new Columna("X", 0)).toThrow(RangeError);
  });

  test("añadir guarda la tarea y la devuelve; solo acepta Tareas", () => {
    const c = new Columna("Por hacer");
    const t = tarea("A");
    expect(c.añadir(t)).toBe(t);
    expect(c.tareas).toEqual([t]);
    expect(() => c.añadir({ titulo: "falsa" })).toThrow(TypeError);
  });

  test("límite WIP: con 2 de 2, llena y no admite más", () => {
    const c = new Columna("En curso", 2);
    c.añadir(tarea("A"));
    expect(c.llena).toBe(false);
    c.añadir(tarea("B"));
    expect(c.llena).toBe(true);
    expect(() => c.añadir(tarea("C"))).toThrow(/llena/i);
    expect(c.tareas).toHaveLength(2);
  });

  test("sin límite WIP nunca se llena", () => {
    const c = new Columna("Por hacer");
    for (let i = 0; i < 50; i++) c.añadir(tarea(`T${i}`));
    expect(c.llena).toBe(false);
  });

  test("quitar(id) la saca y la devuelve; si no está, Error", () => {
    const c = new Columna("Por hacer");
    const a = c.añadir(tarea("A"));
    const b = c.añadir(tarea("B"));
    expect(c.quitar(a.id)).toBe(a);
    expect(c.tareas).toEqual([b]);
    expect(c.tiene(a.id)).toBe(false);
    expect(() => c.quitar(a.id)).toThrow(/no está/i);
  });

  test("tareas es una COPIA: no se puede romper la columna desde fuera", () => {
    const c = new Columna("Por hacer");
    c.añadir(tarea("A"));
    c.tareas.push(tarea("intrusa"));
    c.tareas.length = 0;
    expect(c.tareas).toHaveLength(1);
  });

  test("ordenadas(): alta primero; a igual prioridad, el límite más cercano; sin límite al final", () => {
    const c = new Columna("Por hacer");
    c.añadir(tarea("media sin límite"));
    c.añadir(tarea("baja", "baja", "2026-10-20"));
    c.añadir(tarea("media 30/10", "media", "2026-10-30"));
    c.añadir(tarea("alta", "alta"));
    c.añadir(tarea("media 25/10", "media", "2026-10-25"));
    expect(c.ordenadas().map((t) => t.titulo)).toEqual([
      "alta",
      "media 25/10",
      "media 30/10",
      "media sin límite",
      "baja",
    ]);
  });

  test("ordenadas() no cambia el orden guardado (sort sobre una copia)", () => {
    const c = new Columna("Por hacer");
    c.añadir(tarea("baja", "baja"));
    c.añadir(tarea("alta", "alta"));
    c.ordenadas();
    expect(c.tareas.map((t) => t.titulo)).toEqual(["baja", "alta"]);
  });
});
