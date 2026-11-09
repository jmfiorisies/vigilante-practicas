// 👀 A0 · El ejemplo resuelto. Estas pruebas ya salen en VERDE desde el principio:
// léelas para ver cómo se prueba una clase.
import { describe, expect, test } from "vitest";
import { Tarea } from "../../src/modelo/Tarea.js";
import { parsearFecha } from "../../src/modelo/fechas.js";

describe("👀 A0 · Tarea (ejemplo resuelto)", () => {
  test("se crea con prioridad media por defecto y sin límite", () => {
    const t = new Tarea("  Preparar el examen  ");
    expect(t.titulo).toBe("Preparar el examen");
    expect(t.prioridad).toBe("media");
    expect(t.limite).toBeNull();
    expect(t.creada).toBeInstanceOf(Date);
  });

  test("cada tarea tiene un id distinto y correlativo", () => {
    const a = new Tarea("A");
    const b = new Tarea("B");
    expect(b.id).toBe(a.id + 1);
  });

  test("el constructor y los setters no dejan datos inválidos", () => {
    expect(() => new Tarea("   ")).toThrow(TypeError);
    expect(() => new Tarea("x".repeat(81))).toThrow(RangeError);
    expect(() => new Tarea("A", "urgentísima")).toThrow(RangeError);
    const t = new Tarea("A");
    expect(() => {
      t.prioridad = "nula";
    }).toThrow(RangeError);
    expect(t.prioridad).toBe("media");
  });

  test("la fecha límite «AAAA-MM-DD» se lee en hora local (la trampa del UTC)", () => {
    const t = new Tarea("A", "media", "2026-10-23");
    expect(t.limite.getDate()).toBe(23);
    expect(t.limite.getHours()).toBe(0);
    expect(() => parsearFecha("2026-02-30")).toThrow(RangeError);
  });

  test("estaVencida compara solo días", () => {
    const t = new Tarea("A", "media", "2026-10-23");
    expect(t.estaVencida(new Date(2026, 9, 23, 18, 0))).toBe(false); // el mismo día, aún no
    expect(t.estaVencida(new Date(2026, 9, 24))).toBe(true);
    expect(new Tarea("Sin límite").estaVencida()).toBe(false);
  });

  test("bajarPrioridad baja un nivel y no pasa de «baja»", () => {
    const t = new Tarea("A", "alta");
    expect(t.bajarPrioridad()).toBe(true);
    expect(t.prioridad).toBe("media");
    t.bajarPrioridad();
    expect(t.bajarPrioridad()).toBe(false);
    expect(t.prioridad).toBe("baja");
  });

  test("los campos # no se ven desde fuera", () => {
    expect(Object.keys(new Tarea("A"))).not.toContain("titulo");
  });
});
