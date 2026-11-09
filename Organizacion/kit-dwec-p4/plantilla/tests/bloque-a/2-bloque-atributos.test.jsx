import { describe, expect, test } from "vitest";
import BloqueAtributos from "../../src/componentes/BloqueAtributos.jsx";
import { BRENNA } from "../../src/datos/ejemplo.js";
import { avisoDeKey, montar, texto } from "../ayuda.jsx";

describe("A2 · BloqueAtributos", () => {
  test("pinta seis div.atributo dentro de section.atributos", () => {
    const { c } = montar(<BloqueAtributos puntuaciones={BRENNA.puntuaciones} />);
    const section = c.querySelector("section.atributos");
    expect(section).not.toBeNull();
    expect(section.querySelectorAll(".atributo")).toHaveLength(6);
  });

  test("en el orden de ATRIBUTOS: Fuerza, Destreza, Constitución, Inteligencia, Sabiduría, Carisma", () => {
    const { c } = montar(<BloqueAtributos puntuaciones={BRENNA.puntuaciones} />);
    expect([...c.querySelectorAll(".atributo h3")].map(texto)).toEqual([
      "Fuerza",
      "Destreza",
      "Constitución",
      "Inteligencia",
      "Sabiduría",
      "Carisma",
    ]);
  });

  test("cada uno con SU valor de puntuaciones (Brenna: 17, 10, 16, 8, 12, 10)", () => {
    const { c } = montar(<BloqueAtributos puntuaciones={BRENNA.puntuaciones} />);
    expect([...c.querySelectorAll(".atributo .valor")].map(texto)).toEqual([
      "17",
      "10",
      "16",
      "8",
      "12",
      "10",
    ]);
    expect([...c.querySelectorAll(".atributo .mod")].map(texto)).toEqual([
      "+3",
      "+0",
      "+3",
      "-1",
      "+1",
      "+0",
    ]);
  });

  test("sin el aviso de React de la key (cada elemento de la lista, con su key)", () => {
    montar(<BloqueAtributos puntuaciones={BRENNA.puntuaciones} />);
    expect(avisoDeKey()).toBe(false);
  });
});
