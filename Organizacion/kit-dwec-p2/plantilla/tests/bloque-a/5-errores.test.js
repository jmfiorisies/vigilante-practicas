import { describe, expect, test } from "vitest";
import {
  ColumnaLlenaError,
  ErrorTablero,
  MovimientoNoPermitidoError,
} from "../../src/modelo/errores.js";
import { id, nuevo, titulos } from "./comun.js";

describe("✍️ A4 · Errores propios", () => {
  test("ErrorTablero hereda de Error y su name es el de la clase", () => {
    const e = new ErrorTablero("algo");
    expect(e).toBeInstanceOf(Error);
    expect(e.message).toBe("algo");
    expect(e.name).toBe("ErrorTablero");
    expect(e.stack).toBeTypeOf("string");
  });

  test("las dos subclases son ErrorTablero y llevan su propio name", () => {
    const llena = new ColumnaLlenaError({ nombre: "En curso", limiteWip: 2 });
    const prohibido = new MovimientoNoPermitidoError(7, "Hecho", "Por hacer");
    for (const e of [llena, prohibido]) {
      expect(e).toBeInstanceOf(ErrorTablero);
      expect(e).toBeInstanceOf(Error);
    }
    expect(llena.name).toBe("ColumnaLlenaError");
    expect(prohibido.name).toBe("MovimientoNoPermitidoError");
  });

  test("ColumnaLlenaError guarda la columna y el límite, y el mensaje los dice", () => {
    const e = new ColumnaLlenaError({ nombre: "En curso", limiteWip: 2 });
    expect(e.columna).toBe("En curso");
    expect(e.limite).toBe(2);
    expect(e.message).toMatch(/En curso/);
    expect(e.message).toMatch(/2/);
    expect(e.message).toMatch(/llena/i);
  });

  test("MovimientoNoPermitidoError guarda desde y hasta", () => {
    const e = new MovimientoNoPermitidoError(7, "Hecho", "Por hacer");
    expect(e.desde).toBe("Hecho");
    expect(e.hasta).toBe("Por hacer");
    expect(e.message).toMatch(/7/);
  });

  test("mover a una columna llena lanza ColumnaLlenaError (no un Error cualquiera)", () => {
    const t = nuevo(1);
    t.mover(id(t, "Escribir el README"), "En curso");
    const css = id(t, "Revisar el CSS");
    expect(() => t.mover(css, "En curso")).toThrow(ColumnaLlenaError);
    expect(titulos(t, "Por hacer")).toContain("Revisar el CSS");
  });
});

describe("✍️ A5 · Reglas de movimiento", () => {
  test("«Hecho» es definitivo: mover desde «Hecho» lanza MovimientoNoPermitidoError", () => {
    const t = nuevo();
    const readme = id(t, "Escribir el README");
    t.completar(readme);
    expect(() => t.mover(readme, "Por hacer")).toThrow(MovimientoNoPermitidoError);
    expect(() => t.mover(readme, "En curso")).toThrow(MovimientoNoPermitidoError);
    expect(t.dondeEsta(readme).nombre).toBe("Hecho");
  });

  test("tampoco se puede completar lo que ya está hecho", () => {
    const t = nuevo();
    const readme = id(t, "Escribir el README");
    t.completar(readme);
    expect(() => t.completar(readme)).toThrow(MovimientoNoPermitidoError);
    expect(t.columna("Hecho").tareas).toHaveLength(1);
  });

  test("mover a la columna en la que ya está lanza MovimientoNoPermitidoError", () => {
    const t = nuevo();
    const css = id(t, "Revisar el CSS");
    expect(() => t.mover(css, "Por hacer")).toThrow(MovimientoNoPermitidoError);
    expect(titulos(t, "Por hacer")).toHaveLength(5);
  });

  test("el error de la regla sale aunque el destino esté lleno (primero la regla)", () => {
    const t = nuevo(1);
    const readme = id(t, "Escribir el README");
    t.mover(readme, "En curso"); // «En curso» llena
    expect(() => t.mover(readme, "En curso")).toThrow(MovimientoNoPermitidoError);
  });

  test("los movimientos permitidos siguen funcionando", () => {
    const t = nuevo();
    const bd = id(t, "Diseñar la base de datos");
    t.mover(bd, "En curso");
    t.mover(bd, "Por hacer"); // volver atrás desde «En curso» sí se puede
    t.mover(bd, "En curso");
    t.completar(bd);
    expect(t.dondeEsta(bd).nombre).toBe("Hecho");
  });
});
