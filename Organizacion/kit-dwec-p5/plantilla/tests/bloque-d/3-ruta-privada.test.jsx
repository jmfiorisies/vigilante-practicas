// ✍️ D3 · RutaPrivada y PaginaEntrar
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, test } from "vitest";
import RutaPrivada from "../../src/estado/RutaPrivada.jsx";
import { SesionProvider } from "../../src/estado/SesionContext.jsx";
import PaginaEntrar from "../../src/paginas/PaginaEntrar.jsx";
import { ANA, MostrarRuta, texto } from "../ayuda.jsx";

function pintar(ruta, inicial = null) {
  return render(
    <SesionProvider inicial={inicial}>
      <MemoryRouter initialEntries={[ruta]}>
        <Routes>
          <Route
            path="/secreto"
            element={
              <RutaPrivada>
                <p>dentro</p>
              </RutaPrivada>
            }
          />
          <Route path="/entrar" element={<PaginaEntrar />} />
          <Route path="/misiones" element={<p>tablón</p>} />
        </Routes>
        <MostrarRuta />
      </MemoryRouter>
    </SesionProvider>,
  );
}
const ruta = () => screen.getByTestId("ruta");

async function entrarComoAna(u) {
  await u.type(screen.getByLabelText("Nombre"), "Ana");
  await u.selectOptions(screen.getByLabelText("Clase"), "Mago");
  await u.click(screen.getByRole("button", { name: "Entrar en el gremio" }));
}

describe("D3 · Ruta privada y entrar", () => {
  test("sin sesión: no deja pasar y lleva a /entrar, recordando de dónde venía (state.desde)", () => {
    pintar("/secreto");
    expect(screen.queryByText("dentro")).toBeNull();
    expect(texto(ruta())).toBe("/entrar");
    expect(JSON.parse(ruta().dataset.state)).toEqual({ desde: "/secreto" });
  });

  test("con sesión: pinta lo de dentro", () => {
    pintar("/secreto", ANA);
    expect(screen.getByText("dentro")).toBeTruthy();
  });

  test("al entrar con TU formulario del aventurero vuelve a donde iba; si no venía de ningún sitio, a /misiones", async () => {
    const u = userEvent.setup();
    pintar("/secreto");
    expect(screen.getByRole("heading", { name: "Entrar en el gremio" })).toBeTruthy();
    await entrarComoAna(u);
    await waitFor(() => expect(texto(ruta())).toBe("/secreto"));
    expect(screen.getByText("dentro")).toBeTruthy();
  });

  test("entrar directamente en /entrar: después, a /misiones", async () => {
    const u = userEvent.setup();
    pintar("/entrar");
    await entrarComoAna(u);
    await waitFor(() => expect(texto(ruta())).toBe("/misiones"));
  });
});
