import { describe, expect, test } from "vitest";
import { arrancar, CLAVE, guardarTablero } from "../../src/datos/persistencia.js";
import { Tablero } from "../../src/modelo/Tablero.js";
import { almacenFalso, fetchFalso, fetchSinRed } from "../simulados.js";

const INICIALES = [{ titulo: "Inicial 1", prioridad: "alta" }, { titulo: "Inicial 2" }];
const titulos = (t) => t.columnas.flatMap((c) => c.tareas).map((x) => x.titulo);

describe("✍️ C5 · guardarTablero", () => {
  test(`guarda el tablero como JSON en la clave «${CLAVE}»`, () => {
    const s = almacenFalso();
    guardarTablero(Tablero.desde([{ titulo: "A" }]), s);
    expect(JSON.parse(s.getItem(CLAVE)).columnas["Por hacer"][0].titulo).toBe("A");
  });
});

describe("✍️ C6 · arrancar", () => {
  test("si hay un tablero guardado, se recupera y NO se pide nada a la red", async () => {
    const s = almacenFalso();
    guardarTablero(Tablero.desde([{ titulo: "Guardada" }]), s);
    const f = fetchFalso({ cuerpo: INICIALES });
    const { tablero, origen } = await arrancar({ storage: s, fetchFn: f });
    expect(origen).toBe("guardado");
    expect(titulos(tablero)).toEqual(["Guardada"]);
    expect(f.pedidas).toEqual([]);
  });

  test("si no hay nada guardado: descarga las tareas iniciales", async () => {
    const f = fetchFalso({ cuerpo: INICIALES });
    const { tablero, origen } = await arrancar({
      storage: almacenFalso(),
      fetchFn: f,
      url: "/ini.json",
    });
    expect(origen).toBe("inicial");
    expect(titulos(tablero)).toEqual(["Inicial 1", "Inicial 2"]);
    expect(f.pedidas).toEqual(["/ini.json"]);
  });

  test("lo guardado está roto (no es JSON): se ignora y se descargan las iniciales", async () => {
    const s = almacenFalso({ [CLAVE]: "{roto" });
    const { origen } = await arrancar({ storage: s, fetchFn: fetchFalso({ cuerpo: INICIALES }) });
    expect(origen).toBe("inicial");
  });

  test("lo guardado es de otra versión: se BORRA y se descargan las iniciales", async () => {
    const s = almacenFalso({ [CLAVE]: JSON.stringify({ version: 99, columnas: {} }) });
    const { origen } = await arrancar({ storage: s, fetchFn: fetchFalso({ cuerpo: INICIALES }) });
    expect(origen).toBe("inicial");
    expect(s.getItem(CLAVE)).toBeNull();
  });

  test("sin red: tablero vacío, origen «vacio» y el mensaje del error (no revienta)", async () => {
    const { tablero, origen, error } = await arrancar({
      storage: almacenFalso(),
      fetchFn: fetchSinRed,
    });
    expect(origen).toBe("vacio");
    expect(tablero).toBeInstanceOf(Tablero);
    expect(titulos(tablero)).toEqual([]);
    expect(error).toMatch(/fetch/i);
  });

  test("respuesta que no es JSON: también «vacio» con su error", async () => {
    const f = fetchFalso({ tipo: "text/html", cuerpo: "<!doctype html>" });
    const { origen, error } = await arrancar({ storage: almacenFalso(), fetchFn: f });
    expect(origen).toBe("vacio");
    expect(error).toMatch(/JSON/);
  });

  test("el límite WIP de las iniciales se puede elegir", async () => {
    const f = fetchFalso({ cuerpo: INICIALES });
    const { tablero } = await arrancar({ storage: almacenFalso(), fetchFn: f, limiteEnCurso: 5 });
    expect(tablero.columna("En curso").limiteWip).toBe(5);
  });
});
