import { within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import Forja from "../../src/forja/Forja.jsx";
import { montar, texto } from "../ayuda.jsx";

const valores = (c) => [...c.querySelectorAll(".ficha .atributo .valor")].map(texto).join(",");
async function subir(q, nombre, n) {
  for (let i = 0; i < n; i++)
    await userEvent.click(q.getByRole("button", { name: `Subir ${nombre}` }));
}

describe("B5 · Forja", () => {
  test("al empezar: 27 de 27 puntos, todo lo que falta y la ficha vacía (con tu Ficha)", () => {
    const { c } = montar(<Forja />);
    expect(texto(c.querySelector(".opciones .puntos"))).toBe("Puntos: 27 de 27");
    expect(texto(c.querySelector(".vista .falta"))).toBe(
      "Te falta: el nombre, la raza, la clase, gastar 27 puntos",
    );
    expect(texto(c.querySelector(".vista .ficha h2"))).toBe("Sin nombre");
    expect(valores(c)).toBe("8,8,8,8,8,8");
    expect(c.querySelectorAll(".control-atributo")).toHaveLength(6);
  });

  test("el nombre es un input controlado: lo que escribes sale en la ficha (sin espacios a los lados)", async () => {
    const { c } = montar(<Forja />);
    const q = within(c);
    const input = q.getByLabelText("Nombre");
    await userEvent.type(input, "  Ana");
    expect(input.value).toBe("  Ana");
    expect(texto(c.querySelector(".ficha h2"))).toBe("Ana");
    expect(texto(c.querySelector(".falta"))).not.toMatch(/el nombre/);
  });

  test("raza: un <select> con «— Elige —» y las seis razas; al elegir Enano, la ficha suma +2 a Constitución", async () => {
    const { c } = montar(<Forja />);
    const select = within(c).getByLabelText("Raza");
    expect([...select.options].map((o) => o.textContent)).toEqual([
      "— Elige —",
      "Humano",
      "Elfo",
      "Enano",
      "Mediano",
      "Semiorco",
      "Dracónido",
    ]);
    await userEvent.selectOptions(select, "enano");
    expect(select.value).toBe("enano");
    expect(texto(c.querySelector(".ficha header p"))).toBe("Enano · ? · Nivel 1");
    expect(valores(c)).toBe("8,8,10,8,8,8");
  });

  test("puntos y clase: los botones gastan puntos, la ficha enseña los valores FINALES y los PV con la clase", async () => {
    const { c } = montar(<Forja />);
    const q = within(c);
    await userEvent.selectOptions(q.getByLabelText("Raza"), "enano");
    await subir(q, "Constitución", 6); // 14 + 2 = 16
    expect(texto(c.querySelector(".puntos"))).toBe("Puntos: 20 de 27");
    expect(valores(c)).toBe("8,8,16,8,8,8");
    await userEvent.click(q.getByRole("button", { name: "Elegir Guerrero" }));
    expect(texto(c.querySelector(".ficha p.pv"))).toBe("❤️ 13 PV");
    expect(c.querySelector("article.tarjeta-clase.elegida h3")?.textContent).toMatch(/Guerrero/);
  });

  test("con todo hecho, «⚔️ ¡Ana se une a la aventura!» (role=status) y nada que falte; Reiniciar lo deja como al principio", async () => {
    const { c } = montar(<Forja />);
    const q = within(c);
    await userEvent.type(q.getByLabelText("Nombre"), "Ana");
    await userEvent.selectOptions(q.getByLabelText("Raza"), "elfo");
    await userEvent.click(q.getByRole("button", { name: "Elegir Pícaro" }));
    await subir(q, "Destreza", 7);
    await subir(q, "Constitución", 6);
    await subir(q, "Sabiduría", 5);
    await subir(q, "Carisma", 3);
    await subir(q, "Inteligencia", 3);
    expect(texto(c.querySelector(".puntos"))).toBe("Puntos: 0 de 27");
    const listo = c.querySelector(".vista p.listo");
    expect(listo?.getAttribute("role")).toBe("status");
    expect(texto(listo)).toBe("⚔️ ¡Ana se une a la aventura!");
    expect(c.querySelector(".falta")).toBeNull();
    await userEvent.click(q.getByRole("button", { name: "Reiniciar" }));
    expect(q.getByLabelText("Nombre").value).toBe("");
    expect(q.getByLabelText("Raza").value).toBe("");
    expect(texto(c.querySelector(".falta"))).toBe(
      "Te falta: el nombre, la raza, la clase, gastar 27 puntos",
    );
    expect(valores(c)).toBe("8,8,8,8,8,8");
  });
});
