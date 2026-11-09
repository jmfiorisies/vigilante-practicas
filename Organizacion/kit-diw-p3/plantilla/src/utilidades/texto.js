// texto.js — 👀 ya está hecho. Para buscar sin que importen las mayúsculas ni las tildes.

/** "La huerta de Inés" → "la huerta de ines" */
export function sinTildes(texto) {
  return String(texto ?? "")
    .normalize("NFD") // separa la letra de su tilde: "é" → "e" + "´"
    .replace(/\p{Diacritic}/gu, "") // y quita las tildes sueltas
    .toLowerCase();
}

/** ¿Está «busca» dentro de «texto»? Sin mirar mayúsculas ni tildes. contiene("La huerta de Inés", "ines") → true */
export function contiene(texto, busca) {
  return sinTildes(texto).includes(sinTildes(busca).trim());
}
