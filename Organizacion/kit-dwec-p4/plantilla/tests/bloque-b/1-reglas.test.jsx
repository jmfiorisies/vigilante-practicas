import { describe, expect, test } from "vitest";
import { buscar, CLASES, RAZAS } from "../../src/datos/reglas.js";
import { aplicarRaza, costeTotal, puntosDeGolpe, restantes } from "../../src/logica/reglas.js";
import { congelar } from "../ayuda.jsx";

const TODO8 = { fue: 8, des: 8, con: 8, int: 8, sab: 8, car: 8 };
const ESTANDAR = { fue: 15, des: 14, con: 13, int: 12, sab: 10, car: 8 };

describe("B1 · Las reglas (funciones puras)", () => {
  test("costeTotal: todo a 8 cuesta 0; 15, 14, 13, 12, 10, 8 cuesta 9 + 7 + 5 + 4 + 2 + 0 = 27", () => {
    expect(costeTotal(TODO8)).toBe(0);
    expect(costeTotal(ESTANDAR)).toBe(27);
    expect(costeTotal({ ...TODO8, fue: 14 })).toBe(7);
  });

  test("restantes: los 27 puntos menos lo gastado", () => {
    expect(restantes(TODO8)).toBe(27);
    expect(restantes({ ...TODO8, des: 13, con: 12 })).toBe(18);
    expect(restantes(ESTANDAR)).toBe(0);
  });

  test("aplicarRaza: suma los bonos de la raza (enano: +2 Constitución; semiorco: +2 Fuerza y +1 Constitución)", () => {
    expect(aplicarRaza(ESTANDAR, buscar(RAZAS, "enano"))).toEqual({ ...ESTANDAR, con: 15 });
    expect(aplicarRaza(ESTANDAR, buscar(RAZAS, "semiorco"))).toEqual({
      ...ESTANDAR,
      fue: 17,
      con: 14,
    });
    expect(aplicarRaza(TODO8, buscar(RAZAS, "humano"))).toEqual({
      fue: 9,
      des: 9,
      con: 9,
      int: 9,
      sab: 9,
      car: 9,
    });
  });

  test("aplicarRaza: devuelve un objeto NUEVO y no cambia el que recibe (llega congelado); sin raza, una copia", () => {
    const original = congelar({ ...ESTANDAR });
    const r = aplicarRaza(original, buscar(RAZAS, "elfo"));
    expect(r).not.toBe(original);
    expect(original.des).toBe(14);
    const copia = aplicarRaza(original, undefined);
    expect(copia).toEqual(ESTANDAR);
    expect(copia).not.toBe(original);
  });

  test("puntosDeGolpe: dado de golpe + MODIFICADOR de Constitución; sin clase, 0", () => {
    expect(puntosDeGolpe(buscar(CLASES, "guerrero"), 16)).toBe(13);
    expect(puntosDeGolpe(buscar(CLASES, "mago"), 8)).toBe(5);
    expect(puntosDeGolpe(buscar(CLASES, "barbaro"), 15)).toBe(14);
    expect(puntosDeGolpe(buscar(CLASES, "mago"), 3)).toBe(2);
    expect(puntosDeGolpe(undefined, 14)).toBe(0);
  });
});
