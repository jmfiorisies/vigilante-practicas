import { describe, expect, test } from "vitest";
import ListaRasgos from "../../src/componentes/ListaRasgos.jsx";
import { montar, texto } from "../ayuda.jsx";

describe("A3 · ListaRasgos", () => {
  test("div.rasgos con el título en un <h3> y un <li> por rasgo, en orden", () => {
    const { c } = montar(
      <ListaRasgos titulo="Rasgos de Elfo" rasgos={["Visión en la oscuridad", "Trance"]} />,
    );
    const div = c.querySelector("div.rasgos");
    expect(texto(div.querySelector("h3"))).toBe("Rasgos de Elfo");
    expect([...div.querySelectorAll("ul > li")].map(texto)).toEqual([
      "Visión en la oscuridad",
      "Trance",
    ]);
    expect(div.querySelector(".vacio")).toBeNull();
  });

  test('con la lista vacía: <p class="vacio">Sin rasgos</p> y ningún <ul>', () => {
    const { c } = montar(<ListaRasgos titulo="Rasgos" rasgos={[]} />);
    expect(texto(c.querySelector("p.vacio"))).toBe("Sin rasgos");
    expect(c.querySelector("ul")).toBeNull();
    expect(texto(c.querySelector("div.rasgos"))).toBe("RasgosSin rasgos"); // nada más: ni un 0 suelto
  });

  test("sin la prop rasgos: también «Sin rasgos» (y no revienta)", () => {
    const { c } = montar(<ListaRasgos titulo="Rasgos" />);
    expect(texto(c.querySelector("p.vacio"))).toBe("Sin rasgos");
  });
});
