import { describe, expect, test } from "vitest";
import Etiqueta from "../../src/componentes/Etiqueta.jsx";
import { montar } from "../ayuda.jsx";

describe("👀 A0 · Etiqueta (ejemplo resuelto)", () => {
  test("pinta un <span> con la clase de su tipo y lo de dentro", () => {
    const { c } = montar(<Etiqueta tipo="dado">d10</Etiqueta>);
    const span = c.querySelector("span");
    expect(span.className).toBe("etiqueta etiqueta--dado");
    expect(span.textContent).toBe("d10");
  });

  test("sin tipo, «normal»", () => {
    const { c } = montar(<Etiqueta>hola</Etiqueta>);
    expect(c.querySelector("span").className).toBe("etiqueta etiqueta--normal");
  });
});
