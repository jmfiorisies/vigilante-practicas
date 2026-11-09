// compra.js — 👀 ya está hecho. La página Comprar entradas: la película y la sesión elegidas, las butacas y el formulario.
import { Cabecera } from "../../organismos/cabecera/cabecera.js";
import { SelectorButacas } from "../../organismos/selector-butacas/selector-butacas.js";
import { FormularioCompra } from "../../organismos/formulario-compra/formulario-compra.js";
import { activarButacas } from "../../organismos/selector-butacas/selector-butacas.interaccion.js";
import { activarCompra } from "../../organismos/formulario-compra/formulario-compra.interaccion.js";
import { peliculas, DIAS } from "../../../datos/cartelera.js";

/** La película y la sesión de la dirección (?pelicula=…&sesion=…); si no hay, la primera */
export function elegir(busqueda = "") {
  const q = new URLSearchParams(busqueda);
  const pelicula = peliculas.find((p) => p.id === q.get("pelicula") && p.sesiones.length) ?? peliculas[0];
  const sesion = pelicula.sesiones.find((s) => s.id === q.get("sesion")) ?? pelicula.sesiones[0];
  return { pelicula, sesion };
}

export function PaginaCompra({ pelicula = peliculas[0], sesion = peliculas[0].sesiones[0] } = {}) {
  const cuando = `${DIAS[sesion.dia]} ${sesion.hora} · ${sesion.sala}${sesion.formato ? ` · ${sesion.formato}` : ""}`;
  return `<div class="compra">
  ${Cabecera({ actual: "compra" })}
  <main class="compra__principal">
    <h1 class="compra__titulo">Comprar entradas</h1>
    <p class="compra__resumen"><strong>«${pelicula.titulo}»</strong> · ${cuando}</p>
    ${SelectorButacas({ precio: pelicula.precio })}
    ${FormularioCompra({ pelicula: pelicula.titulo, sesion: cuando })}
  </main>
</div>`;
}

export function activarPaginaCompra(raiz) {
  activarButacas(raiz);
  activarCompra(raiz);
}
