// ✍️ D4 · BotonAceptar, ContadorGrupo, PaginaGrupo y todo junto en App
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, test } from "vitest";
import App from "../../src/App.jsx";
import BotonAceptar from "../../src/estado/BotonAceptar.jsx";
import ContadorGrupo from "../../src/estado/ContadorGrupo.jsx";
import { GrupoProvider } from "../../src/estado/GrupoContext.jsx";
import { SesionProvider } from "../../src/estado/SesionContext.jsx";
import PaginaGrupo from "../../src/paginas/PaginaGrupo.jsx";
import { ANA, DB, MostrarRuta, simularApi, texto } from "../ayuda.jsx";

const [M1, M2, M3, M4] = DB.misiones;
const grupo = (jsx, aceptadas = [], extra = {}) =>
  render(
    <MemoryRouter>
      <GrupoProvider inicial={{ aceptadas, oro: 0, completadas: 0, ...extra }}>{jsx}</GrupoProvider>
    </MemoryRouter>,
  );

describe("D4 · El grupo en la página", () => {
  test("BotonAceptar: «Aceptar misión» → «✔ Aceptada»; con el grupo lleno, «Grupo completo (3/3)» desactivado", async () => {
    grupo(
      <>
        <BotonAceptar mision={M1} />
        <ContadorGrupo />
      </>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Aceptar misión" }));
    expect(screen.getByRole("button", { name: "✔ Aceptada" }).disabled).toBe(true);
    expect(texto(document.querySelector("span.contador-grupo"))).toBe("🎒 1/3");
  });

  test("con 3 aceptadas, otra misión no se puede aceptar", () => {
    grupo(<BotonAceptar mision={M4} />, [M1, M2, M3]);
    expect(screen.getByRole("button", { name: "Grupo completo (3/3)" }).disabled).toBe(true);
  });

  test("PaginaGrupo vacía: el resumen y «Tu grupo no ha aceptado ninguna misión» con su enlace", () => {
    const { container } = grupo(<PaginaGrupo />, [], { oro: 40, completadas: 2 });
    expect(texto(container.querySelector("p.resumen"))).toBe("💰 40 de oro · ✅ 2 completadas");
    expect(texto(container.querySelector("p.vacio"))).toBe(
      "Tu grupo no ha aceptado ninguna misión",
    );
    expect(screen.getByRole("link", { name: "Ir al tablón" })).toBeTruthy();
  });

  test("PaginaGrupo con misiones: Completar suma el oro y Abandonar la quita", async () => {
    const { container } = grupo(<PaginaGrupo />, [M1, M2]);
    expect(container.querySelectorAll("li")).toHaveLength(2);
    await userEvent.click(screen.getByRole("button", { name: `Completar ${M1.titulo}` }));
    expect(texto(container.querySelector("p.resumen"))).toBe(
      `💰 ${M1.recompensa} de oro · ✅ 1 completadas`,
    );
    await userEvent.click(screen.getByRole("button", { name: `Abandonar ${M2.titulo}` }));
    expect(texto(container.querySelector("p.resumen"))).toBe(
      `💰 ${M1.recompensa} de oro · ✅ 1 completadas`,
    );
    expect(texto(container.querySelector("p.vacio"))).toBe(
      "Tu grupo no ha aceptado ninguna misión",
    );
  });

  test("todo junto en App: /publicar y /grupo son privadas; aceptar en la misión sube el contador y sale en /grupo", async () => {
    const u = userEvent.setup();
    simularApi();
    render(
      <SesionProvider>
        <GrupoProvider>
          <MemoryRouter initialEntries={["/grupo"]}>
            <App />
            <MostrarRuta />
          </MemoryRouter>
        </GrupoProvider>
      </SesionProvider>,
    );
    expect(texto(screen.getByTestId("ruta"))).toBe("/entrar");
    await u.type(screen.getByLabelText("Nombre"), ANA.nombre);
    await u.selectOptions(screen.getByLabelText("Clase"), ANA.clase);
    await u.click(screen.getByRole("button", { name: "Entrar en el gremio" }));
    await waitFor(() => expect(texto(screen.getByTestId("ruta"))).toBe("/grupo"));
    await u.click(screen.getByRole("link", { name: "Ir al tablón" }));
    await screen.findByRole("heading", { name: "Tablón de misiones" });
    await u.click(document.querySelectorAll("article.tarjeta-mision button")[2]);
    await u.click(await screen.findByRole("button", { name: "Aceptar misión" }));
    expect(texto(document.querySelector("span.contador-grupo"))).toBe("🎒 1/3");
    await u.click(screen.getByRole("link", { name: "Mi grupo" }));
    expect(screen.getByRole("button", { name: `Completar ${M3.titulo}` })).toBeTruthy();
  });
});
