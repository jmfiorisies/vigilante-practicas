// montar.js — 👀 ya está hecho. Para las historias de Storybook con interacción.
// Un componente de la UD7 devuelve TEXTO (HTML). Para que responda hay que convertirlo en elementos de verdad y
// después «activarlo» (ponerle los addEventListener). Esto hace las dos cosas y devuelve la caja: Storybook la pinta.
//
//   render: (args) => montar(Sinopsis(args), activarSinopsis)
export function montar(html, ...activar) {
  const caja = document.createElement("div");
  caja.innerHTML = html;
  for (const f of activar) f(caja);
  return caja;
}
