import { describe, expect, test } from "vitest";
import { aDatos, desdeDatos, fechaATexto } from "../../src/modelo/serializar.js";
import { Tarea } from "../../src/modelo/Tarea.js";
import { TareaRecurrente } from "../../src/modelo/TareaRecurrente.js";

describe("👀 C0 · fechaATexto (ejemplo resuelto)", () => {
  test("AAAA-MM-DD con ceros delante", () => {
    expect(fechaATexto(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(fechaATexto(new Date(2026, 10, 20))).toBe("2026-11-20");
  });

  test("en hora LOCAL: la medianoche del 20/11 sigue siendo el 20 (toISOString diría el 19)", () => {
    const medianoche = new Date(2026, 10, 20, 0, 0);
    expect(medianoche.toISOString().slice(0, 10)).toBe("2026-11-19"); // la trampa
    expect(fechaATexto(medianoche)).toBe("2026-11-20");
  });
});

describe("👀 C0 · aDatos (ejemplo resuelto)", () => {
  test("una tarea → objeto plano con id, titulo, prioridad y limite en texto", () => {
    const t = new Tarea("Entregar", "alta", "2026-11-25");
    expect(aDatos(t)).toEqual({
      id: t.id,
      titulo: "Entregar",
      prioridad: "alta",
      limite: "2026-11-25",
    });
  });

  test("sin límite → limite: null", () => {
    expect(aDatos(new Tarea("A")).limite).toBeNull();
  });

  test("una recurrente lleva además cadaDias", () => {
    const r = new TareaRecurrente("Regar", "media", "2026-11-21", 3);
    expect(aDatos(r)).toMatchObject({ titulo: "Regar", limite: "2026-11-21", cadaDias: 3 });
  });

  test("el resultado sobrevive a JSON (JSON.stringify de la tarea a secas daría {})", () => {
    const t = new Tarea("Probar", "media", "2026-11-25");
    expect(JSON.stringify(t)).not.toContain("Probar"); // los # no se ven
    expect(JSON.parse(JSON.stringify(aDatos(t)))).toEqual(aDatos(t));
  });
});

describe("✍️ C1 · desdeDatos", () => {
  test("vuelve a ser una Tarea de verdad, con sus métodos y su Date", () => {
    const t = desdeDatos({ titulo: "Entregar", prioridad: "alta", limite: "2026-11-25" });
    expect(t).toBeInstanceOf(Tarea);
    expect(t.limite).toBeInstanceOf(Date);
    expect(t.limite.getDate()).toBe(25);
    expect(t.estaVencida(new Date(2026, 10, 26))).toBe(true);
  });

  test("con cadaDias, una TareaRecurrente", () => {
    const r = desdeDatos({
      titulo: "Regar",
      prioridad: "media",
      limite: "2026-11-21",
      cadaDias: 3,
    });
    expect(r).toBeInstanceOf(TareaRecurrente);
    expect(r.siguiente().limite.getDate()).toBe(24);
  });

  test("ida y vuelta: aDatos → JSON → desdeDatos da la misma tarea", () => {
    const original = new TareaRecurrente("Copia", "baja", "2026-11-30", 7);
    const copia = desdeDatos(JSON.parse(JSON.stringify(aDatos(original))));
    expect(aDatos(copia)).toMatchObject({
      titulo: "Copia",
      prioridad: "baja",
      limite: "2026-11-30",
      cadaDias: 7,
    });
  });
});
