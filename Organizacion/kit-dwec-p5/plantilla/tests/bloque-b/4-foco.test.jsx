// ✍️ B4 · useRef al input: limpiar y devolver el foco
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { misionesDePrueba } from "../../src/datos/gremio.js";
import Buscador from "../../src/tablon/Buscador.jsx";
import { texto } from "../ayuda.jsx";

const MS = misionesDePrueba(60);

describe("B4 · Limpiar la búsqueda", () => {
  test("«Limpiar búsqueda» vacía el texto, vuelven todas y el foco vuelve al input", async () => {
    const u = userEvent.setup();
    const { container } = render(<Buscador misiones={MS} />);
    const campo = screen.getByLabelText("Buscar");
    await u.type(campo, "grifo");
    await u.click(screen.getByRole("button", { name: "Limpiar búsqueda" }));
    expect(campo.value).toBe("");
    expect(texto(container.querySelector("p.cuantas"))).toBe("60 misiones");
    expect(document.activeElement).toBe(campo);
  });

  test("Escape en el input hace lo mismo", async () => {
    const u = userEvent.setup();
    render(<Buscador misiones={MS} />);
    const campo = screen.getByLabelText("Buscar");
    await u.type(campo, "torre");
    await u.keyboard("{Escape}");
    expect(campo.value).toBe("");
    expect(document.activeElement).toBe(campo);
  });
});
