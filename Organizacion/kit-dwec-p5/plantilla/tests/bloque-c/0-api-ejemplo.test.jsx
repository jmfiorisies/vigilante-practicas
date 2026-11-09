// 👀 C0 · pedirMisiones (no cuenta para nota)
import { describe, expect, test } from "vitest";
import { pedirMisiones } from "../../src/api.js";
import { DB, simularApi } from "../ayuda.jsx";

describe("👀 C0 · pedirMisiones", () => {
  test("GET /api/misiones → las misiones; con un 500, lanza «Error 500»", async () => {
    simularApi();
    expect(await pedirMisiones()).toHaveLength(DB.misiones.length);
    simularApi({ fallo: true });
    await expect(pedirMisiones()).rejects.toThrow("Error 500");
  });
});
