// 👀 B0 · medir.js — Contadores para MEDIR (UD10, apartado 7). No hace falta tocarlo. Las pruebas los leen; tú puedes
// verlos en la consola del navegador:  import { medida } from "./medir.js";  console.log(medida);
export const medida = { renders: {}, filtrados: 0 };

// Llama a contar("Nombre") en la primera línea de un componente: cuenta sus renders
export function contar(nombre) {
  medida.renders[nombre] = (medida.renders[nombre] ?? 0) + 1;
}
export const renders = (nombre) => medida.renders[nombre] ?? 0;
export function aCero() {
  medida.renders = {};
  medida.filtrados = 0;
}

// filtrar(misiones, texto, rango): las misiones cuyo título o región contienen el texto (sin mayúsculas ni espacios a
// los lados) y, si rango no es "", de ese rango. Cuenta cuántas veces se llama: con cientos de misiones, cada vez cuesta.
export function filtrar(misiones, texto, rango) {
  medida.filtrados++;
  const t = texto.trim().toLowerCase();
  return misiones.filter(
    (m) =>
      (m.titulo.toLowerCase().includes(t) || m.region.toLowerCase().includes(t)) &&
      (rango === "" || m.rango === rango),
  );
}
