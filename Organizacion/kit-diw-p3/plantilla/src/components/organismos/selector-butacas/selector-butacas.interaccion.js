// selector-butacas.interaccion.js — ✍️ B2. Elegir las butacas (apartado B2 del enunciado).
// Con UN SOLO addEventListener por selector (en .butacas__sala: la delegación):
//   - al empezar, cada butaca libre con aria-pressed="false";
//   - al pulsar una libre, se elige (aria-pressed="true"); al pulsarla otra vez, se suelta; las ocupadas, nada;
//   - 6 como máximo: la 7.ª no se elige y el resumen lo avisa;
//   - el resumen (.butacas__resumen) dice cuáles y cuánto cuesta, con el precio del data-precio del <fieldset>:
//       «Ninguna butaca elegida»  ·  «1 butaca: B2 · 5,50 €»  ·  «2 butacas: B2, B3 · 11,00 €»
//   - y, al elegir una, se esconde el error de las butacas (.butacas__error) si estaba a la vista.
const MAXIMO = 6;

/** 👀 Las butacas elegidas de un selector: ["A3", "A4"]. La usa también el formulario de compra (✍️ B3) */
export function elegidas(selector) {
  return [...selector.querySelectorAll('.butacas__butaca[aria-pressed="true"]')].map((b) => b.dataset.butaca);
}

export function activarButacas(raiz) {
  // ✍️ aquí
  void MAXIMO;
}
