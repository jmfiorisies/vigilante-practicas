// mi-cita.js — Mi cita: buscar la cita por el código del SMS, y lo que se puede hacer con ella.
import { CITAS } from "../datos/citas.js";

const CALENDARIO = `<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>`;
const IMPRIMIR = `<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V3h12v6M6 18H4v-7h16v7h-2M8 14h8v7H8z"/></svg>`;

/** 👀 Pinta la cita encontrada, con sus acciones (los datos son nuestros: vienen de CITAS) */
function pintarCita(seccion, cita) {
  seccion.innerHTML = `<h2 id="cita-titulo">Tu cita</h2>
    <p>${cita.dia} a las ${cita.hora}, con ${cita.profesional} (${cita.sala}).</p>
    <div class="cita__acciones">
      <button type="button" class="cita__icono" aria-label="Añadir al calendario">${CALENDARIO}</button>
      <button type="button" class="cita__icono" aria-label="Imprimir">${IMPRIMIR}</button>
      <button type="button" class="boton boton--peligro cita__anular">Anular cita</button>
    </div>
    <p class="cita__mensaje" role="status"></p>`;
  seccion.hidden = false;
  const mensaje = seccion.querySelector(".cita__mensaje");
  seccion.querySelector(".cita__anular").addEventListener("click", () => {
    mensaje.textContent = "Cita anulada. Si necesitas otra, pídela en «Pedir cita».";
  });
}

// ✍️ A3 · Buscar la cita (y qué pasa cuando el código no está)
export function activarMiCita(raiz) {
  const form = raiz.querySelector(".buscar");
  const campo = form.querySelector(".buscar__campo");
  const error = form.querySelector(".buscar__error");
  const seccion = raiz.querySelector(".cita");
  form.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const cita = CITAS[campo.value.trim().toUpperCase()];
    if (!cita) {
      error.textContent = "Código no válido.";
      seccion.hidden = true;
      return;
    }
    error.textContent = "";
    pintarCita(seccion, cita);
  });
}
