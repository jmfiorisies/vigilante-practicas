// ✍️ C3 · Las páginas: tablón, misión y publicar (con una API de mentira y contextos de prueba)
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, test } from "vitest";
import PaginaMision from "../../src/paginas/PaginaMision.jsx";
import PaginaPublicar from "../../src/paginas/PaginaPublicar.jsx";
import PaginaTablon from "../../src/paginas/PaginaTablon.jsx";
import { conContextos, DB, MostrarRuta, simularApi, texto } from "../ayuda.jsx";

function pintar(ruta) {
  return render(
    conContextos(
      <MemoryRouter initialEntries={[ruta]}>
        <Routes>
          <Route path="/misiones" element={<PaginaTablon />} />
          <Route path="/misiones/:id" element={<PaginaMision />} />
          <Route path="/publicar" element={<PaginaPublicar />} />
        </Routes>
        <MostrarRuta />
      </MemoryRouter>,
    ),
  );
}
const ruta = () => texto(screen.getByTestId("ruta"));

describe("C3 · Las páginas", () => {
  test("tablón: «Cargando misiones…» y luego el título y TU Buscador con las misiones de la API", async () => {
    simularApi();
    const { container } = pintar("/misiones");
    expect(texto(container.querySelector("p.cargando"))).toBe("Cargando misiones…");
    expect(await screen.findByRole("heading", { name: "Tablón de misiones" })).toBeTruthy();
    expect(texto(container.querySelector("p.cuantas"))).toBe(`${DB.misiones.length} misiones`);
  });

  test("tablón: al pulsar «Ver» va a la página de esa misión (/misiones/<id>)", async () => {
    simularApi();
    const { container } = pintar("/misiones");
    await screen.findByRole("heading", { name: "Tablón de misiones" });
    await userEvent.click(container.querySelectorAll("article.tarjeta-mision button")[1]);
    await waitFor(() => expect(ruta()).toBe(`/misiones/${DB.misiones[1].id}`));
  });

  test("tablón con la API caída: «No se ha podido cargar el tablón (Error 500)»", async () => {
    simularApi({ fallo: true });
    pintar("/misiones");
    expect(texto(await screen.findByRole("alert"))).toBe(
      "No se ha podido cargar el tablón (Error 500)",
    );
  });

  test("misión: el id sale de la ruta; título, rango, región, oro, plazas y descripción", async () => {
    simularApi();
    const m = DB.misiones.find((x) => x.descripcion);
    const { container } = pintar(`/misiones/${m.id}`);
    expect(texto(container.querySelector("p.cargando"))).toBe("Cargando misión…");
    expect(await screen.findByRole("heading", { name: m.titulo })).toBeTruthy();
    const art = container.querySelector("article.detalle-mision");
    expect(texto(art)).toContain(`Rango ${m.rango} · ${m.region}`);
    expect(texto(art)).toContain(`💰 ${m.recompensa} de oro · 👥 ${m.plazas} plazas`);
    expect(texto(art.querySelector("p.descripcion"))).toBe(m.descripcion);
  });

  test("misión que no existe: «Esa misión no existe» y un enlace que vuelve al tablón", async () => {
    simularApi();
    pintar("/misiones/999");
    expect(await screen.findByRole("heading", { name: "Esa misión no existe" })).toBeTruthy();
    await userEvent.click(screen.getByRole("link", { name: "Volver al tablón" }));
    expect(ruta()).toBe("/misiones");
  });

  test("publicar: TU FormMision; al enviar, POST y a la página de la misión nueva; con la API caída, el aviso", async () => {
    const u = userEvent.setup();
    const f = simularApi();
    pintar("/publicar");
    expect(screen.getByRole("heading", { name: "Publicar una misión" })).toBeTruthy();
    await u.type(screen.getByLabelText("Título"), "Cazar un grifo");
    await u.selectOptions(screen.getByLabelText("Rango"), "C");
    await u.selectOptions(screen.getByLabelText("Región"), "Costa de Sal");
    await u.click(screen.getByRole("button", { name: "Publicar misión" }));
    await waitFor(() => expect(ruta()).toBe("/misiones/m1"));
    expect(f.creadas[0]).toMatchObject({ titulo: "Cazar un grifo", recompensa: 10, plazas: 4 });
  });

  test("publicar con la API caída: «No se ha podido publicar (Error 500)» y se queda en /publicar", async () => {
    const u = userEvent.setup();
    simularApi({ fallo: true });
    pintar("/publicar");
    await u.type(screen.getByLabelText("Título"), "Cazar un grifo");
    await u.selectOptions(screen.getByLabelText("Rango"), "C");
    await u.selectOptions(screen.getByLabelText("Región"), "Costa de Sal");
    await u.click(screen.getByRole("button", { name: "Publicar misión" }));
    expect(texto(await screen.findByRole("alert"))).toBe("No se ha podido publicar (Error 500)");
    expect(ruta()).toBe("/publicar");
  });
});
