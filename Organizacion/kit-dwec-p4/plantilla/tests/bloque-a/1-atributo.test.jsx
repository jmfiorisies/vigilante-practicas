import { describe, expect, test } from "vitest";
import Atributo from "../../src/componentes/Atributo.jsx";
import { montar, texto } from "../ayuda.jsx";

describe("A1 · Atributo", () => {
  test("pinta un div.atributo con el nombre en un <h3>, p.valor y p.mod", () => {
    const { c } = montar(<Atributo nombre="Fuerza" valor={17} />);
    const div = c.firstElementChild;
    expect(div.tagName).toBe("DIV");
    expect(div.className).toBe("atributo");
    expect(texto(div.querySelector("h3"))).toBe("Fuerza");
    expect(texto(div.querySelector("p.valor"))).toBe("17");
    expect(texto(div.querySelector("p.mod"))).toBe("+3");
  });

  test("el modificador se redondea HACIA ABAJO y lleva signo: 8 → -1 · 9 → -1 · 10 → +0 · 11 → +0 · 15 → +2", () => {
    const mod = (valor) =>
      texto(montar(<Atributo nombre="X" valor={valor} />).c.querySelector("p.mod"));
    expect([8, 9, 10, 11, 15].map(mod)).toEqual(["-1", "-1", "+0", "+0", "+2"]);
  });

  test("usa sus props: con otro nombre y otro valor, otra casilla", () => {
    const { c } = montar(<Atributo nombre="Carisma" valor={12} />);
    expect(texto(c)).toBe("Carisma12+1");
  });
});
