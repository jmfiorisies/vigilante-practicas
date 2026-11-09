// inicio.js — Lo que hace la página Inicio: el acordeón del horario y el aviso de la campaña de la gripe.
import { activarHorario } from "./horario.js";

const AVISO = `<p class="aviso__texto"><strong>Campaña de la gripe:</strong> vacúnate sin cita los martes y jueves,
  de 9:00 a 12:00. <a href="/folletos/vacuna-gripe.pdf">Folleto de la vacuna (PDF, 1 página)</a></p>`;

export function activarInicio(raiz) {
  activarHorario(raiz);
  // ✍️ D3 · El aviso de la gripe llega «del servidor» un segundo después
  setTimeout(() => {
    const aviso = document.createElement("div");
    aviso.className = "aviso";
    aviso.innerHTML = AVISO;
    raiz.querySelector("main")?.prepend(aviso);
  }, 1000);
}
