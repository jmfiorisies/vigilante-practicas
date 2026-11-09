// 👀 B0 · filtrar y los contadores de medir.js (no cuentan para nota)
import { describe, expect, test } from "vitest";
import { misionesDePrueba } from "../../src/datos/gremio.js";
import { aCero, filtrar, medida } from "../../src/tablon/medir.js";

describe("👀 B0 · filtrar", () => {
  test("filtra por título o región, sin mayúsculas, y por rango; y cuenta cada llamada", () => {
    aCero();
    const ms = misionesDePrueba(100);
    expect(filtrar(ms, "", "")).toHaveLength(100);
    expect(filtrar(ms, "  BOSQUE ", "").every((m) => m.region === "Bosque Umbrío")).toBe(true);
    expect(filtrar(ms, "", "S").every((m) => m.rango === "S")).toBe(true);
    expect(medida.filtrados).toBe(3);
  });
});
