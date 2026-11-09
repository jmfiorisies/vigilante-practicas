// cartelera.js — ✍️ A4. La PÁGINA Cartelera = la plantilla con los datos de verdad.
//   PaginaCartelera()  →  la plantilla con la Cabecera (con «Cartelera» marcada), el Estreno de la semana, el Filtro de
//                         la cartelera y una Tarjeta por cada película de src/datos/cartelera.js
//   PaginaCartelera({ datos: [una, otra] })  →  solo esas películas
import { PlantillaCartelera } from "../../plantillas/cartelera/cartelera.js";
import { activarFiltro } from "../../plantillas/cartelera/cartelera.interaccion.js";
import { activarTrailer } from "../../moleculas/trailer/trailer.interaccion.js";

export function PaginaCartelera() {
  // ✍️ aquí
  return PlantillaCartelera({ tarjetas: ["<p>✍️ A4 · la página</p>"] });
}

/** 👀 Le pone el comportamiento a toda la página (una vez pintada): el filtro (✍️ B1) y el tráiler (✍️ B4) */
export function activarCartelera(raiz) {
  activarFiltro(raiz);
  activarTrailer(raiz);
}
