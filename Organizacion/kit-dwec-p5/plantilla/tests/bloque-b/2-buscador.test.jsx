// ✍️ B2 · Buscador: filtrar con useMemo
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { misionesDePrueba } from "../../src/datos/gremio.js";
import Buscador from "../../src/tablon/Buscador.jsx";
import { aCero, medida } from "../../src/tablon/medir.js";
import { avisoDeKey, texto } from "../ayuda.jsx";

const MS = misionesDePrueba(60);
const cuantas = (c) => texto(c.querySelector("p.cuantas"));

describe("B2 · Buscador", () => {
  test("al empezar, todas: «60 misiones» y 60 tarjetas (con key)", () => {
    const { container } = render(<Buscador misiones={MS} />);
    expect(cuantas(container)).toBe("60 misiones");
    expect(container.querySelectorAll("article.tarjeta-mision")).toHaveLength(60);
    expect(avisoDeKey()).toBe(false);
  });

  test("buscar y filtrar por rango: solo las que tocan, y lo dice", async () => {
    const u = userEvent.setup();
    const { container } = render(<Buscador misiones={MS} />);
    await u.type(screen.getByLabelText("Buscar"), "BOSQUE");
    const bosque = MS.filter(
      (m) => m.region === "Bosque Umbrío" || m.titulo.toLowerCase().includes("bosque"),
    );
    expect(cuantas(container)).toBe(`${bosque.length} misiones`);
    await u.selectOptions(screen.getByLabelText("Rango"), "S");
    const s = bosque.filter((m) => m.rango === "S");
    expect(container.querySelectorAll("article.tarjeta-mision")).toHaveLength(s.length);
    expect(screen.getByLabelText("Rango").options[0].textContent).toBe("Todos");
  });

  test("sin resultados: «0 misiones» y p.vacio «Ninguna misión con esos filtros»", async () => {
    const { container } = render(<Buscador misiones={MS} />);
    await userEvent.type(screen.getByLabelText("Buscar"), "zzz");
    expect(cuantas(container)).toBe("0 misiones");
    expect(texto(container.querySelector("p.vacio"))).toBe("Ninguna misión con esos filtros");
  });

  test("useMemo: cambiar a la vista compacta NO vuelve a filtrar (y las tarjetas pierden p.datos)", async () => {
    const { container } = render(<Buscador misiones={MS} />);
    aCero();
    await userEvent.click(screen.getByLabelText("Vista compacta"));
    expect(container.querySelector("p.datos")).toBeNull();
    expect(medida.filtrados).toBe(0);
  });
});
