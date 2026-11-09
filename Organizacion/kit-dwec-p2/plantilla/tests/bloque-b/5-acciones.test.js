// @vitest-environment happy-dom
import { describe, expect, test, vi } from "vitest";
import { $, montar, pulsar, tarjeta, titulos } from "./comun.js";

describe("✍️ B5 · Acciones con delegación", () => {
  test("empezar → «En curso»; volver → «Por hacer»; completar → «Hecho» (y se repinta)", () => {
    montar();
    pulsar("Escribir el README", "empezar");
    expect(titulos("En curso")).toEqual(["Escribir el README"]);
    expect($('[data-columna="En curso"] .contador').textContent).toBe("(1/2)");
    pulsar("Escribir el README", "volver");
    expect(titulos("En curso")).toEqual([]);
    pulsar("Escribir el README", "empezar");
    pulsar("Escribir el README", "completar");
    expect(titulos("Hecho")).toEqual(["Escribir el README"]);
    expect($('[data-dato="progreso"]').textContent).toBe("25 %"); // 1 de 4
  });

  test("completar una recurrente: aparece la siguiente en «Por hacer»", () => {
    montar();
    pulsar("Copia de seguridad", "empezar");
    pulsar("Copia de seguridad", "completar");
    expect(titulos("Por hacer")).toContain("Copia de seguridad");
    expect(titulos("Hecho")).toEqual(["Copia de seguridad"]);
  });

  test("columna llena: aviso visible con el mensaje del error, y la tarea no se mueve", () => {
    montar({ limite: 1 });
    pulsar("Escribir el README", "empezar");
    pulsar("Revisar el CSS", "empezar");
    expect($("#aviso").hidden).toBe(false);
    expect($("#aviso").textContent).toMatch(/llena/i);
    expect(titulos("Por hacer")).toContain("Revisar el CSS");
  });

  test("la siguiente acción que sale bien esconde el aviso", () => {
    montar({ limite: 1 });
    pulsar("Escribir el README", "empezar");
    pulsar("Revisar el CSS", "empezar");
    pulsar("Escribir el README", "volver");
    expect($("#aviso").hidden).toBe(true);
  });

  test("repintar NO duplica listeners: tras varios repintados, un clic llama UNA vez al tablero", () => {
    const { tablero } = montar({ limite: 1 });
    pulsar("Escribir el README", "empezar");
    pulsar("Escribir el README", "volver");
    pulsar("Escribir el README", "empezar");
    const mover = vi.spyOn(tablero, "mover");
    pulsar("Revisar el CSS", "empezar"); // columna llena: no se repinta y el botón sigue ahí
    expect(mover).toHaveBeenCalledTimes(1);
  });

  test("pulsar el texto de dentro del botón también vale (closest)", () => {
    montar();
    const boton = tarjeta("Escribir el README").querySelector('[data-accion="empezar"]');
    boton.append(document.createElement("span"));
    boton.querySelector("span").click();
    expect(titulos("En curso")).toEqual(["Escribir el README"]);
  });

  test("alCambiar se llama tras cada cambio que sale bien (lo usarás en la UD6)", () => {
    const { cambios, tablero } = montar({ limite: 1 });
    pulsar("Escribir el README", "empezar");
    pulsar("Revisar el CSS", "empezar"); // falla: columna llena
    pulsar("Escribir el README", "volver");
    expect(cambios).toHaveLength(2);
    expect(cambios[0]).toBe(tablero);
  });
});
