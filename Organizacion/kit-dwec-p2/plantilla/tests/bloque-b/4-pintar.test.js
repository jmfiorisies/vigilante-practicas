// @vitest-environment happy-dom
import { describe, expect, test } from "vitest";
import { $, lista, montar, pulsar, tarjeta, titulos } from "./comun.js";

describe("✍️ B4 · Pintar el tablero", () => {
  test("cada tarea en su columna, ordenada como Columna.ordenadas()", () => {
    montar();
    expect(titulos("Por hacer")).toEqual([
      "Diseñar la base de datos",
      "Copia de seguridad",
      "Escribir el README",
      "Revisar el CSS",
    ]);
    expect(lista("En curso").textContent).toBe("Sin tareas");
    expect(lista("Hecho").textContent).toBe("Sin tareas");
  });

  test("contadores: (n) y, en la columna con límite, (n/límite)", () => {
    montar();
    expect($('[data-columna="Por hacer"] .contador').textContent).toBe("(4)");
    expect($('[data-columna="En curso"] .contador').textContent).toBe("(0/2)");
    expect($('[data-columna="Hecho"] .contador').textContent).toBe("(0)");
  });

  test("botones de cada tarjeta según la columna (type=button con data-accion)", () => {
    montar();
    const acciones = (t) => [...tarjeta(t).querySelectorAll("button")].map((b) => b.dataset.accion);
    expect(acciones("Escribir el README")).toEqual(["empezar"]);
    expect(tarjeta("Escribir el README").querySelector("button").type).toBe("button");
    pulsar("Escribir el README", "empezar");
    expect(acciones("Escribir el README")).toEqual(["volver", "completar"]);
    pulsar("Escribir el README", "completar");
    expect(acciones("Escribir el README")).toEqual([]);
  });

  test("la vencida (01/11) lleva tarjeta--vencida", () => {
    montar();
    expect(tarjeta("Diseñar la base de datos").classList.contains("tarjeta--vencida")).toBe(true);
    expect(tarjeta("Escribir el README").classList.contains("tarjeta--vencida")).toBe(false);
  });

  test("resumen: progreso en % (hechas sobre el total) y cuántas están vencidas", () => {
    montar();
    expect($('[data-dato="progreso"]').textContent).toBe("0 %");
    expect($('[data-dato="vencidas"]').textContent).toBe("1");
    expect($("#aviso").hidden).toBe(true);
  });

  test("un título con HTML se pinta como texto", () => {
    montar({ datos: [{ titulo: "<b>negrita</b>" }] });
    expect(lista("Por hacer").querySelector("b")).toBeNull();
    expect(titulos("Por hacer")).toEqual(["<b>negrita</b>"]);
  });
});
