// sesion.js — ✍️ A2. La molécula Sesión: un enlace a la compra de esa sesión (apartado A2 del enunciado).
// Las clases ya están en _sesion.scss. Para el nombre del día («Sábado»), DIAS de src/datos/cartelera.js.
//   Sesion({ id: "lc-sab", pelicula: "luz-caleta", dia: "sab", hora: "22:00", sala: "Patio", formato: "VOSE" })
//     →  un enlace a /compra.html?pelicula=luz-caleta&sesion=lc-sab con el día, la hora, la sala y la chapa «VOSE»
//   sin formato  →  igual, pero sin la chapa
export function Sesion({
  id = "lc-vie",
  pelicula = "luz-caleta",
  dia = "vie",
  hora = "21:30",
  sala = "Patio",
  formato = "",
} = {}) {
  // ✍️ aquí
  return `<a href="#">✍️ A2 ${id} ${pelicula} ${dia} ${hora} ${sala} ${formato}</a>`;
}
