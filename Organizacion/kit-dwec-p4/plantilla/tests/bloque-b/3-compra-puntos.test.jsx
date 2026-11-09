import { act, renderHook } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import useCompraPuntos from "../../src/forja/useCompraPuntos.js";

const TODO8 = { fue: 8, des: 8, con: 8, int: 8, sab: 8, car: 8 };
const veces = (r, accion, clave, n) => {
  for (let i = 0; i < n; i++) act(() => r.current[accion](clave));
};

describe("B3 · useCompraPuntos", () => {
  test("empieza con todo a 8 y 27 puntos por gastar", () => {
    const { result: r } = renderHook(() => useCompraPuntos());
    expect(r.current.puntuaciones).toEqual(TODO8);
    expect(r.current.restantes).toBe(27);
  });

  test("subir y bajar cambian 1 punto, y restantes se recalcula con el coste (de 8 a 14 Fuerza: 7 puntos)", () => {
    const { result: r } = renderHook(() => useCompraPuntos());
    veces(r, "subir", "fue", 6);
    expect(r.current.puntuaciones.fue).toBe(14);
    expect(r.current.restantes).toBe(20);
    veces(r, "bajar", "fue", 1);
    expect(r.current.puntuaciones.fue).toBe(13);
    expect(r.current.restantes).toBe(22);
  });

  test("no sube de 15 ni baja de 8: puedeSubir/puedeBajar lo dicen, y subir/bajar no hacen nada", () => {
    const { result: r } = renderHook(() => useCompraPuntos());
    expect(r.current.puedeBajar("des")).toBe(false);
    veces(r, "bajar", "des", 1);
    expect(r.current.puntuaciones.des).toBe(8);
    veces(r, "subir", "des", 9);
    expect(r.current.puntuaciones.des).toBe(15);
    expect(r.current.puedeSubir("des")).toBe(false);
    expect(r.current.puedeBajar("des")).toBe(true);
  });

  test("no deja gastar más de 27: con 1 punto, de 13 a 14 (cuesta 2) no se puede, pero de 8 a 9 (cuesta 1) sí", () => {
    const { result: r } = renderHook(() => useCompraPuntos());
    veces(r, "subir", "fue", 7); // 15: 9 puntos
    veces(r, "subir", "des", 7); // 15: 9 puntos
    veces(r, "subir", "con", 5); // 13: 5 puntos
    veces(r, "subir", "int", 3); // 11: 3 puntos → quedan 1
    expect(r.current.restantes).toBe(1);
    expect(r.current.puedeSubir("con")).toBe(false);
    veces(r, "subir", "con", 1);
    expect(r.current.puntuaciones.con).toBe(13);
    expect(r.current.puedeSubir("sab")).toBe(true);
    veces(r, "subir", "sab", 2);
    expect(r.current.puntuaciones.sab).toBe(9);
    expect(r.current.restantes).toBe(0);
  });

  test("inmutable: al subir, puntuaciones es un objeto NUEVO y el de antes no cambia", () => {
    const { result: r } = renderHook(() => useCompraPuntos());
    const antes = r.current.puntuaciones;
    veces(r, "subir", "car", 1);
    expect(r.current.puntuaciones).not.toBe(antes);
    expect(antes.car).toBe(8);
  });

  test("reiniciar: todo a 8 otra vez", () => {
    const { result: r } = renderHook(() => useCompraPuntos());
    veces(r, "subir", "sab", 4);
    act(() => r.current.reiniciar());
    expect(r.current.puntuaciones).toEqual(TODO8);
    expect(r.current.restantes).toBe(27);
  });
});
