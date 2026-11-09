// ✍️ C4 · Las rutas de App (dentro del Layout)
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, test } from "vitest";
import App from "../../src/App.jsx";
import { conContextos, DB, MostrarRuta, simularApi, texto } from "../ayuda.jsx";

function pintar(ruta) {
  return render(
    conContextos(
      <MemoryRouter initialEntries={[ruta]}>
        <App />
        <MostrarRuta />
      </MemoryRouter>,
    ),
  );
}
const ruta = () => texto(screen.getByTestId("ruta"));

describe("C4 · Las rutas", () => {
  test("/ lleva a /misiones (el tablón), dentro del Layout (con su cabecera)", async () => {
    simularApi();
    pintar("/");
    await waitFor(() => expect(ruta()).toBe("/misiones"));
    expect(await screen.findByRole("heading", { name: "Tablón de misiones" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "🍺 Tablón del gremio" })).toBeTruthy();
  });

  test("/misiones/:id pinta esa misión", async () => {
    simularApi();
    pintar("/misiones/5");
    expect(
      await screen.findByRole("heading", { name: DB.misiones.find((m) => m.id === "5").titulo }),
    ).toBeTruthy();
  });

  test("una ruta que no existe: la página 404, dentro del Layout", async () => {
    simularApi();
    pintar("/dragones/rojos");
    expect(
      screen.getByRole("heading", { name: "404 · Esta página no está en el mapa" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "🍺 Tablón del gremio" })).toBeTruthy();
  });

  test("el menú lleva a /publicar, con el formulario", async () => {
    simularApi();
    pintar("/misiones");
    await userEvent.click(screen.getByRole("link", { name: "Publicar" }));
    expect(ruta()).toBe("/publicar");
    expect(screen.getByRole("heading", { name: "Publicar una misión" })).toBeTruthy();
  });
});
