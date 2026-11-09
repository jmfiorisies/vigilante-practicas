import { describe, expect, test } from "vitest";
import { borrar, cargar, guardar } from "../../src/datos/almacen.js";
import { almacenFalso } from "../simulados.js";

describe("👀 C0 · almacen (ejemplo resuelto)", () => {
  test("guardar escribe TEXTO (JSON) y cargar lo devuelve como objeto", () => {
    const s = almacenFalso();
    guardar("x", { a: 1, lista: [1, 2] }, s);
    expect(s.getItem("x")).toBe('{"a":1,"lista":[1,2]}');
    expect(cargar("x", null, s)).toEqual({ a: 1, lista: [1, 2] });
  });

  test("si no hay nada, o lo guardado no es JSON, devuelve el valor por defecto", () => {
    const s = almacenFalso({ roto: "{esto no es json" });
    expect(cargar("nada", [], s)).toEqual([]);
    expect(cargar("roto", "def", s)).toBe("def");
  });

  test("borrar quita la clave", () => {
    const s = almacenFalso({ x: "1" });
    borrar("x", s);
    expect(s.getItem("x")).toBeNull();
  });
});
