import { describe, expect, test } from "vitest";
import { obtenerJSON } from "../../src/datos/red.js";
import { fetchFalso, fetchSinRed } from "../simulados.js";

// Los mensajes de error tienen que decir QUÉ URL ha fallado (para poder enseñárselo al usuario)
describe("✍️ C2 · obtenerJSON (async/await)", () => {
  test("devuelve una PROMESA con el JSON ya convertido", async () => {
    const f = fetchFalso({ cuerpo: [{ titulo: "A" }] });
    const promesa = obtenerJSON("/tareas.json", f);
    expect(promesa).toBeInstanceOf(Promise);
    expect(await promesa).toEqual([{ titulo: "A" }]);
    expect(f.pedidas).toEqual(["/tareas.json"]);
  });

  test("un 404 lanza un Error que dice el código", async () => {
    await expect(obtenerJSON("/no.json", fetchFalso({ estado: 404, cuerpo: "" }))).rejects.toThrow(
      /404.*\/no\.json|\/no\.json.*404/,
    );
  });

  test("un 200 que NO es JSON (Vite devuelve index.html si el fichero no existe) también lanza", async () => {
    const f = fetchFalso({ tipo: "text/html", cuerpo: "<!doctype html>" });
    await expect(obtenerJSON("/no.json", f)).rejects.toThrow(/\/no\.json/);
  });

  test("sin red, el error llega a quien llama (no se lo traga)", async () => {
    await expect(obtenerJSON("/x.json", fetchSinRed)).rejects.toThrow(TypeError);
  });
});
