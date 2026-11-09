// ✍️ C2 · useFetch(url)
import { waitFor } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import useFetch from "../../src/hooks/useFetch.js";
import { DB, probarHook, simularApi } from "../ayuda.jsx";

const usar = ({ url }) => useFetch(url);

describe("C2 · useFetch", () => {
  test("empieza cargando y, cuando llega, { datos, cargando: false, error: null }", async () => {
    simularApi();
    const r = probarHook(usar, { url: "/api/misiones" });
    expect(r.actual).toEqual({ datos: null, cargando: true, error: null });
    await waitFor(() => expect(r.actual.cargando).toBe(false));
    expect(r.actual.datos).toHaveLength(DB.misiones.length);
    expect(r.actual.error).toBeNull();
  });

  test('con un 404: { datos: null, cargando: false, error: "Error 404" }', async () => {
    simularApi();
    const r = probarHook(usar, { url: "/api/misiones/999" });
    await waitFor(() => expect(r.actual.cargando).toBe(false));
    expect(r.actual).toEqual({ datos: null, cargando: false, error: "Error 404" });
  });

  test("al cambiar la url: cancela la vieja (signal abortado), vuelve a cargar y se queda con la nueva", async () => {
    const f = simularApi({ retraso: 30 });
    const r = probarHook(usar, { url: "/api/misiones/1" });
    r.cambiar({ url: "/api/misiones/2" });
    expect(r.actual.cargando).toBe(true);
    await new Promise((ok) => setTimeout(ok, 10)); // la vieja ya se ha cancelado: eso NO es un error
    expect(r.actual).toEqual({ datos: null, cargando: true, error: null });
    await waitFor(() => expect(r.actual.cargando).toBe(false));
    expect(r.actual.datos.id).toBe("2");
    expect(f.mock.calls[0][1]?.signal?.aborted).toBe(true);
    expect(r.actual.error).toBeNull();
  });

  test("al desmontar, cancela la petición (limpieza del efecto)", async () => {
    const f = simularApi({ retraso: 30 });
    const r = probarHook(usar, { url: "/api/misiones" });
    r.desmontar();
    expect(f.mock.calls[0][1]?.signal?.aborted).toBe(true);
  });
});
