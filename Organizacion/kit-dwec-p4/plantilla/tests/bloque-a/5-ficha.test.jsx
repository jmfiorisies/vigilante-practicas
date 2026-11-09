import { describe, expect, test } from "vitest";
import Ficha from "../../src/componentes/Ficha.jsx";
import { BRENNA } from "../../src/datos/ejemplo.js";
import { montar, texto } from "../ayuda.jsx";

const NADIE = {
  nombre: "",
  razaId: "",
  claseId: "",
  puntuaciones: { fue: 8, des: 8, con: 8, int: 8, sab: 8, car: 8 },
  pv: 0,
};

describe("A5 · Ficha", () => {
  test("article.ficha con un <header>: el nombre en el <h2> y «Enano · Guerrero · Nivel 1»", () => {
    const { c } = montar(<Ficha personaje={BRENNA} />);
    const header = c.querySelector("article.ficha > header");
    expect(texto(header.querySelector("h2"))).toBe("Brenna Piedrahonda");
    expect(texto(header.querySelector("p"))).toBe("Enano · Guerrero · Nivel 1");
  });

  test("los seis atributos con tu BloqueAtributos (section.atributos con 6 .atributo y sus valores)", () => {
    const { c } = montar(<Ficha personaje={BRENNA} />);
    expect(
      [...c.querySelectorAll("article.ficha section.atributos .atributo .valor")].map(texto),
    ).toEqual(["17", "10", "16", "8", "12", "10"]);
  });

  test('los puntos de golpe: <p class="pv">❤️ 13 PV</p>', () => {
    const { c } = montar(<Ficha personaje={BRENNA} />);
    expect(texto(c.querySelector("p.pv"))).toBe("❤️ 13 PV");
  });

  test("dos ListaRasgos: «Rasgos de Enano» (sus 3 rasgos) y «Rasgos de Guerrero» (sus 2)", () => {
    const { c } = montar(<Ficha personaje={BRENNA} />);
    const listas = [...c.querySelectorAll(".rasgos")];
    expect(listas.map((l) => texto(l.querySelector("h3")))).toEqual([
      "Rasgos de Enano",
      "Rasgos de Guerrero",
    ]);
    expect(listas.map((l) => l.querySelectorAll("li").length)).toEqual([3, 2]);
  });

  test("sin nombre, raza ni clase: «Sin nombre», «? · ? · Nivel 1» y ninguna lista de rasgos", () => {
    const { c } = montar(<Ficha personaje={NADIE} />);
    expect(texto(c.querySelector("h2"))).toBe("Sin nombre");
    expect(texto(c.querySelector("header p"))).toBe("? · ? · Nivel 1");
    expect(c.querySelectorAll(".rasgos")).toHaveLength(0);
  });
});
