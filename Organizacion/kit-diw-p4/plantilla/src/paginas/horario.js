// horario.js — ✍️ A2. El acordeón del horario: cada servicio se abre y se cierra al pulsarlo.
export function activarHorario(raiz) {
  for (const boton of raiz.querySelectorAll(".horario__boton")) {
    boton.addEventListener("click", () => {
      const panel = boton.nextElementSibling;
      panel.hidden = !panel.hidden;
    });
  }
}
