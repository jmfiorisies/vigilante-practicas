import { within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import ElegirClase from "../../src/forja/ElegirClase.jsx";
import { avisoDeKey, montar, texto } from "../ayuda.jsx";

describe("B4 · ElegirClase", () => {
  test("section.clases con seis TarjetaClase (article.tarjeta-clase), cada una con su botón «Elegir …» dentro", () => {
    const { c } = montar(<ElegirClase elegida="" onElegir={() => {}} />);
    const tarjetas = c.querySelectorAll("section.clases > article.tarjeta-clase");
    expect(tarjetas).toHaveLength(6);
    expect(texto(tarjetas[0].querySelector("h3"))).toBe("⚔️ Guerrero");
    expect(tarjetas[1].querySelector("button")?.getAttribute("aria-label")).toBe("Elegir Mago");
  });

  test('al pulsar «Elegir Pícaro» avisa al padre con su id: onElegir("picaro")', async () => {
    const onElegir = vi.fn();
    const { c } = montar(<ElegirClase elegida="" onElegir={onElegir} />);
    await userEvent.click(within(c).getByRole("button", { name: "Elegir Pícaro" }));
    expect(onElegir).toHaveBeenCalledTimes(1);
    expect(onElegir).toHaveBeenCalledWith("picaro");
  });

  test("la elegida se marca (tarjeta-clase elegida) y su botón está desactivado; las demás, no", () => {
    const { c } = montar(<ElegirClase elegida="bardo" onElegir={() => {}} />);
    const elegidas = c.querySelectorAll("article.elegida");
    expect(elegidas).toHaveLength(1);
    expect(texto(elegidas[0].querySelector("h3"))).toBe("🎻 Bardo");
    expect(within(c).getByRole("button", { name: "Elegir Bardo" }).disabled).toBe(true);
    expect(within(c).getByRole("button", { name: "Elegir Mago" }).disabled).toBe(false);
  });

  test("sin el aviso de React de la key", () => {
    montar(<ElegirClase elegida="" onElegir={() => {}} />);
    expect(avisoDeKey()).toBe(false);
  });
});
