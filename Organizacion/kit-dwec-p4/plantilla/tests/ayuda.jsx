// ayuda.jsx — Utilidades de las pruebas. No se toca.
import { render } from "@testing-library/react";

// El texto de un elemento, sin espacios de más
export const texto = (el) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();

// Monta un componente y devuelve { c: el contenedor, … }
export function montar(jsx) {
  const v = render(jsx);
  return { c: v.container, ...v };
}

// ¿Ha avisado React de que falta la key en una lista? (React avisa UNA vez por componente)
export const avisoDeKey = () => globalThis.AVISOS.some((a) => /unique "key"/.test(a));

// Congela un objeto (y lo de dentro): si alguien lo cambia, salta un error
export function congelar(o) {
  Object.values(o).forEach((v) => typeof v === "object" && v !== null && congelar(v));
  return Object.freeze(o);
}
