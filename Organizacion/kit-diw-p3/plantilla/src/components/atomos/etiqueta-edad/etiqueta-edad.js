// etiqueta-edad.js — ✍️ A1. El átomo Etiqueta de edad: la calificación de la película (apartado A1 del enunciado).
// Los nombres de las clases ya están en _etiqueta-edad.scss. Lo que tiene que devolver:
//   EtiquetaEdad({ edad: "12" })  →  un <span> con el bloque y el modificador de esa edad, en el que se ve «+12»
//                                    y el lector de pantalla oye también «no recomendada para menores de 12 años»
//   EtiquetaEdad()                →  la de «TP» (todos los públicos)
//   EtiquetaEdad({ edad: "7", clases: "tarjeta-pelicula__edad" })  →  y además esa clase (la mezcla BEM)
export function EtiquetaEdad({ edad = "tp", clases = "" } = {}) {
  // ✍️ aquí
  return `<span>✍️ A1 ${edad} ${clases}</span>`;
}
