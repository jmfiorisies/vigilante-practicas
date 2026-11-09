// preparar.js — Se ejecuta antes de las pruebas: limpia la página entre una prueba y otra y guarda los avisos de React
// (console.error) para que las pruebas puedan mirarlos. No se toca.
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { format } from "node:util";

globalThis.AVISOS = [];
// eslint-disable-next-line no-console -- aquí se escuchan los avisos de React a propósito
console.error = (...a) => globalThis.AVISOS.push(format(...a));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
