// estreno.js — 👀 ya está hecho. El organismo Estreno de la semana: el cartel grande, el texto y el tráiler.
import { EtiquetaEdad } from "../../atomos/etiqueta-edad/etiqueta-edad.js";
import { Trailer } from "../../moleculas/trailer/trailer.js";
import { peliculas, estreno } from "../../../datos/cartelera.js";

export function Estreno({ datos = estreno } = {}) {
  const p = peliculas.find((x) => x.id === datos.pelicula) ?? peliculas[0];
  return `<section class="estreno" aria-labelledby="estreno-titulo">
  <p class="estreno__antetitulo">Estreno de la semana</p>
  <h2 class="estreno__titulo" id="estreno-titulo">${p.titulo}</h2>
  ${EtiquetaEdad({ edad: p.edad })}
  <p class="estreno__texto">${datos.texto}</p>
  ${Trailer({ titulo: p.titulo, ...datos.trailer })}
</section>`;
}
