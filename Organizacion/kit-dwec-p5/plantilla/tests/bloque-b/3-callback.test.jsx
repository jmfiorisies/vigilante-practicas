// ✍️ B3 · Elegir con useCallback: solo se repintan las tarjetas que cambian
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { misionesDePrueba } from "../../src/datos/gremio.js";
import Buscador from "../../src/tablon/Buscador.jsx";
import { aCero, medida, renders } from "../../src/tablon/medir.js";

const MS = misionesDePrueba(60);

describe("B3 · Elegir", () => {
  test("al pulsar «Ver»: avisa con onElegir(id) y esa tarjeta queda elegida", async () => {
    const onElegir = vi.fn();
    const { container } = render(<Buscador misiones={MS} onElegir={onElegir} />);
    const botones = container.querySelectorAll("article.tarjeta-mision button");
    await userEvent.click(botones[2]);
    expect(onElegir).toHaveBeenCalledWith(MS[2].id);
    expect(container.querySelectorAll("article.tarjeta-mision")[2].className).toBe(
      "tarjeta-mision elegida",
    );
    expect(container.querySelectorAll("article.elegida")).toHaveLength(1);
  });

  test("medido: elegir una repinta 1 tarjeta (y cambiar de elegida, 2), no las 60; y no vuelve a filtrar", async () => {
    const onElegir = vi.fn();
    const { container } = render(<Buscador misiones={MS} onElegir={onElegir} />);
    const botones = container.querySelectorAll("article.tarjeta-mision button");
    aCero();
    await userEvent.click(botones[2]);
    expect(renders("TarjetaMision")).toBe(1);
    await userEvent.click(botones[5]);
    expect(renders("TarjetaMision")).toBe(3);
    expect(medida.filtrados).toBe(0);
  });
});
