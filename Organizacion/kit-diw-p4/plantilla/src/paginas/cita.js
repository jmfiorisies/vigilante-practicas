// cita.js — Pedir cita: el formulario de la agencia.
import { HUECOS } from "../datos/huecos.js";

/** ✍️ C2 · Los huecos libres, para elegir uno. Devuelve el HTML de las opciones (ahora, nada) */
export function Huecos(huecos = HUECOS) {
  void huecos;
  return "";
}

const CAMPOS = ["tarjeta", "nombre", "dni", "nacimiento", "telefono", "motivo", "fecha", "hora"];

export function activarCita(raiz) {
  const form = raiz.querySelector(".cita-form");
  const error = form.querySelector(".cita-form__error");
  const ok = form.querySelector(".cita-form__ok");

  // ✍️ C2 · Los errores y la confirmación
  form.addEventListener("submit", (evento) => {
    evento.preventDefault();
    ok.textContent = "";
    const mal = CAMPOS.findIndex((nombre) => !form.elements[nombre].validity.valid);
    if (mal >= 0) {
      error.textContent = `Error en el campo ${mal + 1}. Formato incorrecto.`;
      return;
    }
    error.textContent = "";
    ok.textContent = "Solicitud registrada (ref. 88231).";
  });
}
