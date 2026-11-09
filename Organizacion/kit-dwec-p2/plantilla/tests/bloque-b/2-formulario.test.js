// @vitest-environment happy-dom
import { beforeEach, describe, expect, test } from "vitest";
import { leerFormulario, mostrarErrores } from "../../src/ui/formulario.js";
import { cargarPagina } from "../pagina.js";

let form;
const rellenar = (valores) => {
  for (const [campo, valor] of Object.entries(valores)) form.elements[campo].value = valor;
};
beforeEach(() => {
  cargarPagina();
  form = document.querySelector("#form-alta");
});

describe("👀 B0 · leerFormulario (ejemplo resuelto)", () => {
  test("título sin espacios de más, prioridad, y sin límite → null", () => {
    rellenar({ titulo: "  Comprar café  ", prioridad: "alta" });
    expect(leerFormulario(form)).toEqual({
      titulo: "Comprar café",
      prioridad: "alta",
      limite: null,
    });
  });

  test("con fecha: el texto AAAA-MM-DD tal cual", () => {
    rellenar({ titulo: "Entregar", limite: "2026-11-13" });
    expect(leerFormulario(form).limite).toBe("2026-11-13");
  });

  test("cadaDias: un NÚMERO si se rellena; si está vacío, la clave no aparece", () => {
    rellenar({ titulo: "Regar", limite: "2026-11-13", cadaDias: "3" });
    expect(leerFormulario(form).cadaDias).toBe(3);
    rellenar({ cadaDias: "" });
    expect("cadaDias" in leerFormulario(form)).toBe(false);
  });

  test("un decimal llega como número (ya lo rechazará la validación del bloque B)", () => {
    rellenar({ titulo: "Regar", cadaDias: "2.5" });
    expect(leerFormulario(form).cadaDias).toBe(2.5);
  });
});

describe("✍️ B2 · mostrarErrores", () => {
  test("escribe el mensaje en su <p data-error-de> y marca el campo con aria-invalid", () => {
    mostrarErrores(form, { titulo: "Escribe un título" });
    expect(form.querySelector('[data-error-de="titulo"]').textContent).toBe("Escribe un título");
    expect(form.elements.titulo.getAttribute("aria-invalid")).toBe("true");
    expect(form.elements.limite.hasAttribute("aria-invalid")).toBe(false);
  });

  test("con varios errores, todos", () => {
    mostrarErrores(form, { limite: "Falta", cadaDias: "Mal" });
    expect(form.querySelector('[data-error-de="limite"]').textContent).toBe("Falta");
    expect(form.querySelector('[data-error-de="cadaDias"]').textContent).toBe("Mal");
  });

  test("al volver a llamarla, limpia los errores que ya no están", () => {
    mostrarErrores(form, { titulo: "Escribe un título", limite: "Falta" });
    mostrarErrores(form, { limite: "Falta" });
    expect(form.querySelector('[data-error-de="titulo"]').textContent).toBe("");
    expect(form.elements.titulo.hasAttribute("aria-invalid")).toBe(false);
    mostrarErrores(form, {});
    expect(form.elements.limite.hasAttribute("aria-invalid")).toBe(false);
  });
});
