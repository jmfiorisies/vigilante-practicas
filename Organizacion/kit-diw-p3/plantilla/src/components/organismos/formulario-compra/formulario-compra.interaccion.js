// formulario-compra.interaccion.js — ✍️ B3. Validar la compra (apartado B3 del enunciado).
// Al enviar el formulario (.compra-form), sin recargar la página:
//   - cada campo que incumple su regla del HTML: su mensaje en su .campo__error (uno distinto para cada fallo,
//     que diga cómo arreglarlo), a la vista, y el campo con aria-invalid="true";
//   - si no hay ninguna butaca elegida (elegidas(), de selector-butacas.interaccion.js): «Elige al menos una
//     butaca.» en .butacas__error;
//   - el foco, a lo primero que está mal (sin butacas: la primera butaca libre);
//   - con todo bien: en .compra-form__ok, quién, cuántas entradas, la película y la sesión (data-* del formulario),
//     las butacas, el total y el correo al que se envían. Y el formulario, vacío.
// Y mientras se escribe: un campo que estaba mal deja de estarlo en cuanto se corrige.
import { elegidas } from "../selector-butacas/selector-butacas.interaccion.js";

export function activarCompra(raiz) {
  // ✍️ aquí
  void elegidas;
}
