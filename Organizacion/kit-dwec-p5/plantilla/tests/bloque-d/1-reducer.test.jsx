// ✍️ D1 · grupoReducer
import { describe, expect, test } from "vitest";
import { GRUPO_INICIAL, grupoReducer } from "../../src/estado/grupoReducer.js";
import { congelar, DB } from "../ayuda.jsx";

const [M1, M2, M3, M4] = DB.misiones;
const con = (...ms) => congelar({ aceptadas: ms, oro: 100, completadas: 1 });

describe("D1 · grupoReducer", () => {
  test("aceptar: la añade al final, en un estado NUEVO (el de antes llega congelado)", () => {
    const antes = con(M1);
    const despues = grupoReducer(antes, { tipo: "aceptar", mision: M2 });
    expect(despues).toEqual({ aceptadas: [M1, M2], oro: 100, completadas: 1 });
    expect(despues).not.toBe(antes);
    expect(grupoReducer(GRUPO_INICIAL, { tipo: "aceptar", mision: M1 }).aceptadas).toEqual([M1]);
  });

  test("aceptar una que ya está, o con 3 ya aceptadas: el MISMO estado", () => {
    const una = con(M1);
    expect(grupoReducer(una, { tipo: "aceptar", mision: { ...M1 } })).toBe(una);
    const llenas = con(M1, M2, M3);
    expect(grupoReducer(llenas, { tipo: "aceptar", mision: M4 })).toBe(llenas);
  });

  test("abandonar: la quita; si no está, el mismo estado", () => {
    const antes = con(M1, M2);
    expect(grupoReducer(antes, { tipo: "abandonar", id: M1.id })).toEqual({
      aceptadas: [M2],
      oro: 100,
      completadas: 1,
    });
    expect(grupoReducer(antes, { tipo: "abandonar", id: "999" })).toBe(antes);
  });

  test("completar: la quita, suma su recompensa al oro y 1 a completadas; si no está, el mismo estado", () => {
    const antes = con(M1, M2);
    expect(grupoReducer(antes, { tipo: "completar", id: M2.id })).toEqual({
      aceptadas: [M1],
      oro: 100 + M2.recompensa,
      completadas: 2,
    });
    expect(grupoReducer(antes, { tipo: "completar", id: "999" })).toBe(antes);
  });

  test("una acción desconocida lanza «Acción desconocida: <tipo>»; y GRUPO_INICIAL está vacío", () => {
    expect(() => grupoReducer(GRUPO_INICIAL, { tipo: "bailar" })).toThrow(
      "Acción desconocida: bailar",
    );
    expect(GRUPO_INICIAL).toEqual({ aceptadas: [], oro: 0, completadas: 0 });
  });
});
