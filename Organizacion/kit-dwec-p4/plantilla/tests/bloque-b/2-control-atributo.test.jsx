import { within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import ControlAtributo from "../../src/forja/ControlAtributo.jsx";
import { montar, texto } from "../ayuda.jsx";

const props = (otras = {}) => ({
  nombre: "Fuerza",
  valor: 8,
  puedeSubir: true,
  puedeBajar: true,
  onSubir: vi.fn(),
  onBajar: vi.fn(),
  ...otras,
});

describe("B2 · ControlAtributo", () => {
  test("div.control-atributo con el nombre (span.nombre), el valor en un <output> y los botones «Bajar Fuerza» y «Subir Fuerza»", () => {
    const { c } = montar(<ControlAtributo {...props({ valor: 13 })} />);
    const div = c.querySelector("div.control-atributo");
    expect(texto(div.querySelector("span.nombre"))).toBe("Fuerza");
    expect(texto(div.querySelector("output"))).toBe("13");
    expect(within(div).getByRole("button", { name: "Bajar Fuerza" })).toBeTruthy();
    expect(within(div).getByRole("button", { name: "Subir Fuerza" })).toBeTruthy();
  });

  test("al pulsar + llama a onSubir (una vez) y a nada más; al pulsar −, a onBajar", async () => {
    const p = props();
    const { c } = montar(<ControlAtributo {...p} />);
    await userEvent.click(within(c).getByRole("button", { name: "Subir Fuerza" }));
    expect(p.onSubir).toHaveBeenCalledTimes(1);
    expect(p.onBajar).not.toHaveBeenCalled();
    await userEvent.click(within(c).getByRole("button", { name: "Bajar Fuerza" }));
    expect(p.onBajar).toHaveBeenCalledTimes(1);
  });

  test("desactiva el botón que no se puede usar (puedeSubir / puedeBajar en false), y entonces no avisa", async () => {
    const p = props({ puedeSubir: false, puedeBajar: true });
    const { c } = montar(<ControlAtributo {...p} />);
    const subir = within(c).getByRole("button", { name: "Subir Fuerza" });
    expect(subir.disabled).toBe(true);
    expect(within(c).getByRole("button", { name: "Bajar Fuerza" }).disabled).toBe(false);
    await userEvent.click(subir);
    expect(p.onSubir).not.toHaveBeenCalled();
  });

  test("no guarda nada: el valor que pinta es SIEMPRE el que le llega (si el padre no lo cambia, sigue igual)", async () => {
    const { c, rerender } = montar(<ControlAtributo {...props({ valor: 8 })} />);
    await userEvent.click(within(c).getByRole("button", { name: "Subir Fuerza" }));
    expect(texto(c.querySelector("output"))).toBe("8");
    rerender(<ControlAtributo {...props({ valor: 9 })} />);
    expect(texto(c.querySelector("output"))).toBe("9");
  });
});
