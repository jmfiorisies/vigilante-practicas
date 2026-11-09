// ✍️ C1 · pedirMision y publicarMision
import { describe, expect, test } from "vitest";
import { pedirMision, publicarMision } from "../../src/api.js";
import { DB, simularApi } from "../ayuda.jsx";

const NUEVA = {
  titulo: "Cazar un grifo",
  rango: "C",
  region: "Costa de Sal",
  recompensa: 120,
  plazas: 3,
  descripcion: "",
};

describe("C1 · La API", () => {
  test('pedirMision("3") → GET /api/misiones/3 y la misión', async () => {
    const f = simularApi();
    expect(await pedirMision("3")).toEqual(DB.misiones.find((m) => m.id === "3"));
    expect(String(f.mock.calls[0][0])).toBe("/api/misiones/3");
  });

  test("pedirMision de una que no existe: lanza «Error 404» (fetch no falla solo)", async () => {
    simularApi();
    await expect(pedirMision("999")).rejects.toThrow("Error 404");
  });

  test("publicarMision: POST a /api/misiones, en JSON con su Content-Type, y devuelve la misión con su id nuevo", async () => {
    const f = simularApi();
    expect(await publicarMision(NUEVA)).toEqual({ ...NUEVA, id: "m1" });
    const [url, opciones] = f.mock.calls[0];
    expect(String(url)).toBe("/api/misiones");
    expect(opciones.method).toBe("POST");
    const cabeceras = new Headers(opciones.headers);
    expect(cabeceras.get("content-type")).toBe("application/json");
    expect(JSON.parse(opciones.body)).toEqual(NUEVA);
  });

  test("publicarMision con el servidor caído: lanza «Error 500»", async () => {
    simularApi({ fallo: true });
    await expect(publicarMision(NUEVA)).rejects.toThrow("Error 500");
  });
});
