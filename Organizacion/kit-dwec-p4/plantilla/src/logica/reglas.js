// logica/reglas.js — Las cuentas del juego. Son funciones PURAS: reciben datos y devuelven un resultado nuevo,
// sin cambiar nada de lo que reciben ni tocar la página.
import { COSTE, PUNTOS } from "../datos/reglas.js";

// 👀 Ya hechas (bloque A): el modificador de un atributo y cómo se escribe.
//    10 u 11 → 0 · 12 o 13 → +1 · 8 o 9 → −1 · 17 → +3 …  Se redondea HACIA ABAJO: (9 − 10) / 2 = −0,5 → −1.
export const modificador = (valor) => Math.floor((valor - 10) / 2);
export const conSigno = (n) => (n >= 0 ? `+${n}` : `${n}`); // 3 → "+3" · 0 → "+0" · −1 → "-1"

// 👀 Ya hecha (bloque B): tirar un dado de N caras (de 1 a N).
export const tirar = (caras) => Math.floor(Math.random() * caras) + 1;

// ✍️ B1 · costeTotal(puntuaciones): cuántos puntos cuesta un reparto. { fue: 15, des: 14, … } → la suma del COSTE
//    de cada valor. Con todo a 8, 0.
export function costeTotal(puntuaciones) {
  throw new Error("Sin hacer");
}

// ✍️ B1 · restantes(puntuaciones): los puntos que quedan por gastar (PUNTOS − costeTotal).
export function restantes(puntuaciones) {
  throw new Error("Sin hacer");
}

// ✍️ B1 · aplicarRaza(puntuaciones, raza): un objeto NUEVO con los bonos de la raza sumados (raza.bonos solo trae
//    los atributos que suben). Si no hay raza (undefined), una copia tal cual. No cambia el que recibe.
export function aplicarRaza(puntuaciones, raza) {
  throw new Error("Sin hacer");
}

// ✍️ B1 · puntosDeGolpe(clase, constitucion): los PV de nivel 1 = clase.dadoGolpe + modificador(constitucion)
//    (¡el MODIFICADOR, no la puntuación!). Sin clase (undefined), 0.
export function puntosDeGolpe(clase, constitucion) {
  throw new Error("Sin hacer");
}
