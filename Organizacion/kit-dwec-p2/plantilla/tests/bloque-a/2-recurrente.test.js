import { describe, expect, test } from "vitest";
import { Tarea } from "../../src/modelo/Tarea.js";
import { TareaRecurrente } from "../../src/modelo/TareaRecurrente.js";

const semanal = () => new TareaRecurrente("Sacar la basura", "media", "2026-10-23", 7);

describe("✍️ A1 · TareaRecurrente extends Tarea", () => {
  test("es una Tarea (herencia de verdad)", () => {
    const t = semanal();
    expect(t).toBeInstanceOf(TareaRecurrente);
    expect(t).toBeInstanceOf(Tarea);
    expect(Object.getPrototypeOf(TareaRecurrente)).toBe(Tarea);
  });

  test("reutiliza lo del padre (validación, prioridad, id…)", () => {
    const t = semanal();
    expect(t.cadaDias).toBe(7);
    expect(t.prioridad).toBe("media");
    expect(() => new TareaRecurrente("", "media", "2026-10-23", 7)).toThrow(TypeError);
  });

  test("cadaDias tiene que ser un entero ≥ 1, y hace falta límite", () => {
    expect(() => new TareaRecurrente("A", "media", "2026-10-23", 0)).toThrow(RangeError);
    expect(() => new TareaRecurrente("A", "media", "2026-10-23", 1.5)).toThrow(RangeError);
    expect(() => new TareaRecurrente("A", "media", null, 3)).toThrow(TypeError);
  });

  test("siguiente(): una tarea NUEVA igual, con el límite N días después", () => {
    const t = semanal();
    const s = t.siguiente();
    expect(s).toBeInstanceOf(TareaRecurrente);
    expect(s).not.toBe(t);
    expect(s.id).not.toBe(t.id);
    expect(s.titulo).toBe("Sacar la basura");
    expect(s.limite.getDate()).toBe(30);
    expect(t.limite.getDate()).toBe(23); // la original no se toca
  });

  test("siguiente() cruza bien de mes (Date lo hace por ti)", () => {
    const t = new TareaRecurrente("Factura", "media", "2026-10-28", 7);
    const s = t.siguiente();
    expect([s.limite.getDate(), s.limite.getMonth() + 1]).toEqual([4, 11]);
  });

  test("polimorfismo: alCompletar() de una normal no da nada; de una recurrente, la siguiente", () => {
    expect(new Tarea("A").alCompletar()).toEqual([]);
    const nuevas = semanal().alCompletar();
    expect(nuevas).toHaveLength(1);
    expect(nuevas[0]).toBeInstanceOf(TareaRecurrente);
  });

  test("toString añade «🔁 cada N días» al del padre (usa super)", () => {
    const t = semanal();
    expect(String(t)).toBe(`#${t.id} [media] Sacar la basura · límite 23/10/2026 · 🔁 cada 7 días`);
  });
});
