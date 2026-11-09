// cartelera.js — ✍️ A4. La plantilla Cartelera: dice DÓNDE va cada cosa, no QUÉ contiene (apartado A4).
//   PlantillaCartelera({ cabecera, destacado, filtro, tarjetas })
//     → la cabecera; y en el <main>: el <h1> «Cartelera de la semana», el destacado y una sección con su título,
//       el filtro, el contador (.cartelera__contador: «5 películas» / «1 película») y la rejilla
//       (<ul class="cartelera__rejilla">) con cada tarjeta en su <li>.
export function PlantillaCartelera({ cabecera = "", destacado = "", filtro = "", tarjetas = [] } = {}) {
  // ✍️ aquí
  return `<div>${cabecera}<main><p>✍️ A4 · la plantilla</p>${destacado}${filtro}${tarjetas.join("")}</main></div>`;
}
