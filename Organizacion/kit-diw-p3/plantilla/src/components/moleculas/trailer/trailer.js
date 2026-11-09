// trailer.js — 👀 ya está hecho. La molécula Tráiler: un botón que, al pulsarlo, pone el vídeo.
// El vídeo NO está en el HTML: lo crea trailer.interaccion.js (✍️ B4) cuando alguien lo pide.
// Las rutas de los formatos y de los subtítulos van en atributos data-* (el JavaScript las lee con dataset).
import { Boton } from "../../atomos/boton/boton.js";

export function Trailer({
  titulo = "La luz de la Caleta",
  webm = "/trailers/luz-caleta.webm",
  mp4 = "/trailers/luz-caleta.mp4",
  vtt = "/trailers/luz-caleta.vtt",
} = {}) {
  return `<div class="trailer" data-titulo="${titulo}" data-webm="${webm}" data-mp4="${mp4}" data-vtt="${vtt}">
  ${Boton({ texto: `Ver el tráiler de «${titulo}»`, variante: "secundario", clases: "trailer__boton" })}
</div>`;
}
