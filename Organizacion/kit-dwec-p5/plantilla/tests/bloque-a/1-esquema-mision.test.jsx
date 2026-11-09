// ✍️ A1 · esquemaMision (Zod)
import { describe, expect, test } from "vitest";
import { esquemaMision } from "../../src/formularios/esquemaMision.js";

const BIEN = {
  titulo: "Cazar un grifo",
  rango: "C",
  region: "Costa de Sal",
  recompensa: 120,
  plazas: 3,
  descripcion: "",
};
const errores = (datos) =>
  Object.fromEntries(
    (esquemaMision.safeParse(datos).error?.issues ?? []).map((i) => [i.path.join("."), i.message]),
  );

describe("A1 · esquemaMision", () => {
  test("una misión bien: success y los datos LIMPIOS (sin espacios a los lados y sin campos de más)", () => {
    const r = esquemaMision.safeParse({
      ...BIEN,
      titulo: "  Cazar un grifo ",
      descripcion: " Traed red ",
      extra: 1,
    });
    expect(r.success).toBe(true);
    expect(r.data).toEqual({ ...BIEN, descripcion: "Traed red" });
  });

  test("todo vacío: un mensaje por campo, los del enunciado", () => {
    expect(
      errores({ titulo: "", rango: "", region: "", recompensa: NaN, plazas: NaN, descripcion: "" }),
    ).toEqual({
      titulo: "El título necesita al menos 5 letras",
      rango: "Elige un rango",
      region: "Elige una región",
      recompensa: "Escribe la recompensa",
      plazas: "Escribe las plazas",
    });
  });

  test("los límites: título de 60, recompensa desde 10 y entera, plazas de 1 a 6, descripción hasta 200", () => {
    expect(errores({ ...BIEN, titulo: "x".repeat(61) }).titulo).toBe("Como mucho 60 letras");
    expect(errores({ ...BIEN, titulo: "   Ab   " }).titulo).toBe(
      "El título necesita al menos 5 letras",
    );
    expect(errores({ ...BIEN, recompensa: 9 }).recompensa).toBe("Como mínimo 10 de oro");
    expect(errores({ ...BIEN, recompensa: "" }).recompensa).toBe("Escribe la recompensa"); // ¡vacío no es 0!
    expect(errores({ ...BIEN, recompensa: 10.5 }).recompensa).toBe(
      "La recompensa va sin decimales",
    );
    expect(errores({ ...BIEN, plazas: 0 }).plazas).toBe("De 1 a 6 plazas");
    expect(errores({ ...BIEN, plazas: 7 }).plazas).toBe("De 1 a 6 plazas");
    expect(errores({ ...BIEN, plazas: 2.5 }).plazas).toBe("Las plazas van sin decimales");
    expect(errores({ ...BIEN, descripcion: "x".repeat(201) }).descripcion).toBe(
      "Como mucho 200 letras",
    );
    expect(errores({ ...BIEN, titulo: "x".repeat(60), recompensa: 10, plazas: 6 })).toEqual({});
  });

  test("regla entre campos: rango A o S con menos de 500 de oro → el error, en la recompensa", () => {
    expect(errores({ ...BIEN, rango: "A", recompensa: 499 })).toEqual({
      recompensa: "Una misión de rango A o S paga al menos 500 de oro",
    });
    expect(errores({ ...BIEN, rango: "S", recompensa: 100 }).recompensa).toBe(
      "Una misión de rango A o S paga al menos 500 de oro",
    );
  });

  test("la regla solo vale para A y S: un S con 500 vale, y un B con 100 también", () => {
    expect(esquemaMision.safeParse({ ...BIEN, rango: "S", recompensa: 500 }).success).toBe(true);
    expect(esquemaMision.safeParse({ ...BIEN, rango: "B", recompensa: 100 }).success).toBe(true);
    expect(esquemaMision.safeParse({ ...BIEN, rango: "S", recompensa: 499 }).success).toBe(false);
  });
});
