// @vitest-environment happy-dom
import { describe, expect, test } from "vitest";
import { validar } from "../../src/ui/app.js";
import { $, montar, titulos } from "./comun.js";

const enviar = (valores) => {
  const form = $("#form-alta");
  for (const [campo, valor] of Object.entries(valores)) form.elements[campo].value = valor;
  const evento = new Event("submit", { cancelable: true, bubbles: true });
  form.dispatchEvent(evento);
  return evento;
};

describe("✍️ B6 · validar(datos)", () => {
  test("todo bien → {}", () => {
    expect(validar({ titulo: "Algo", prioridad: "media", limite: null })).toEqual({});
    expect(
      validar({ titulo: "Algo", prioridad: "media", limite: "2026-11-13", cadaDias: 7 }),
    ).toEqual({});
  });

  test("título vacío o de más de 80 caracteres", () => {
    expect(validar({ titulo: "", prioridad: "media", limite: null })).toHaveProperty("titulo");
    expect(validar({ titulo: "x".repeat(81), prioridad: "media", limite: null })).toHaveProperty(
      "titulo",
    );
    expect(validar({ titulo: "x".repeat(80), prioridad: "media", limite: null })).toEqual({});
  });

  test("cadaDias: entero mayor que 0", () => {
    for (const cadaDias of [0, -3, 2.5, NaN])
      expect(
        validar({ titulo: "A", prioridad: "media", limite: "2026-11-13", cadaDias }),
      ).toHaveProperty("cadaDias");
  });

  test("si se repite, necesita fecha límite (el error va en limite)", () => {
    const errores = validar({ titulo: "A", prioridad: "media", limite: null, cadaDias: 7 });
    expect(Object.keys(errores)).toEqual(["limite"]);
  });
});

describe("✍️ B6 · El formulario de alta", () => {
  test("envía sin recargar la página (preventDefault)", () => {
    montar();
    expect(enviar({ titulo: "Nueva" }).defaultPrevented).toBe(true);
  });

  test("con datos buenos: la tarea aparece en «Por hacer» y el formulario se vacía", () => {
    montar();
    enviar({ titulo: "  Preparar la demo  ", prioridad: "alta", limite: "2026-11-20" });
    // alta como «Diseñar…», pero vence más tarde: va justo detrás (Columna.ordenadas)
    expect(titulos("Por hacer").slice(0, 2)).toEqual([
      "Diseñar la base de datos",
      "Preparar la demo",
    ]);
    expect($("#form-alta").elements.titulo.value).toBe("");
  });

  test("una recurrente desde el formulario", () => {
    const { tablero } = montar();
    enviar({ titulo: "Regar", limite: "2026-11-10", cadaDias: "3" });
    const regar = tablero.columna("Por hacer").tareas.find((t) => t.titulo === "Regar");
    expect(regar.cadaDias).toBe(3);
  });

  test("con errores: no se crea nada, se ven los mensajes y los campos quedan marcados", () => {
    const { tablero } = montar();
    enviar({ titulo: "   ", cadaDias: "0" });
    expect(tablero.columna("Por hacer").tareas).toHaveLength(4);
    expect($('[data-error-de="titulo"]').textContent).not.toBe("");
    expect($('[data-error-de="cadaDias"]').textContent).not.toBe("");
    expect($("#form-alta").elements.titulo.getAttribute("aria-invalid")).toBe("true");
  });

  test("repintar NO duplica el listener del formulario: tras varios cambios, un envío crea UNA tarea", () => {
    const { tablero } = montar();
    enviar({ titulo: "Primera" });
    enviar({ titulo: "Segunda" });
    enviar({ titulo: "Tercera" });
    expect(tablero.columna("Por hacer").tareas).toHaveLength(7);
    // con un listener de más, el segundo leería el formulario ya vacío y enseñaría un error
    expect($('[data-error-de="titulo"]').textContent).toBe("");
  });

  test("al corregir y enviar bien, los errores se borran", () => {
    montar();
    enviar({ titulo: "" });
    enviar({ titulo: "Ahora sí" });
    expect($('[data-error-de="titulo"]').textContent).toBe("");
    expect($("#form-alta").elements.titulo.hasAttribute("aria-invalid")).toBe(false);
  });
});
