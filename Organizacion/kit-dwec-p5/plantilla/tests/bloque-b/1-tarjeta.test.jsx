// ✍️ B1 · TarjetaMision (memo)
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { aCero, renders } from "../../src/tablon/medir.js";
import TarjetaMision from "../../src/tablon/TarjetaMision.jsx";
import { texto } from "../ayuda.jsx";

const M = {
  id: "7",
  titulo: "Cazar un basilisco joven",
  rango: "S",
  region: "Ciénaga Negra",
  recompensa: 1500,
  plazas: 4,
};

describe("B1 · TarjetaMision", () => {
  test("article.tarjeta-mision con el rango (span.rango.rango--S), el título en el <h3> y p.datos", () => {
    const { container } = render(<TarjetaMision mision={M} onElegir={vi.fn()} />);
    const a = container.querySelector("article.tarjeta-mision");
    expect(a.className).toBe("tarjeta-mision");
    expect(texto(a.querySelector("span.rango.rango--S"))).toBe("S");
    expect(texto(a.querySelector("h3"))).toBe("Cazar un basilisco joven");
    expect(texto(a.querySelector("p.datos"))).toBe(
      "💰 1500 de oro · 📍 Ciénaga Negra · 👥 4 plazas",
    );
  });

  test("elegida → clase «tarjeta-mision elegida»; compacta → sin p.datos", () => {
    const { container } = render(<TarjetaMision mision={M} elegida compacta onElegir={vi.fn()} />);
    expect(container.querySelector("article").className).toBe("tarjeta-mision elegida");
    expect(container.querySelector("p.datos")).toBeNull();
  });

  test('al pulsar «Ver» avisa con su id: onElegir("7")', async () => {
    const onElegir = vi.fn();
    render(<TarjetaMision mision={M} onElegir={onElegir} />);
    await userEvent.click(screen.getByRole("button", { name: "Ver Cazar un basilisco joven" }));
    expect(onElegir).toHaveBeenCalledWith("7");
  });

  test("memo + contar: se cuenta cada render, y con las MISMAS props no se vuelve a pintar", () => {
    aCero();
    const onElegir = vi.fn();
    const { rerender } = render(<TarjetaMision mision={M} onElegir={onElegir} />);
    expect(renders("TarjetaMision")).toBe(1);
    rerender(<TarjetaMision mision={M} onElegir={onElegir} />);
    expect(renders("TarjetaMision")).toBe(1);
    rerender(<TarjetaMision mision={M} elegida onElegir={onElegir} />);
    expect(renders("TarjetaMision")).toBe(2);
  });
});
