// tarjeta-pelicula.js — ✍️ A3. El organismo Tarjeta de película (apartado A3 del enunciado).
// COMPONE los componentes que ya tienes (la Etiqueta de edad y la Sesión): impórtalos, no copies su HTML.
// Las clases ya están en _tarjeta-pelicula.scss. Recibe una película de src/datos/cartelera.js y devuelve
// un <article> con:
//   - el cartel en un <picture>: WebP y, si el navegador no lo entiende, JPG (poster viene SIN la extensión);
//   - el título, la etiqueta de edad, el género con la duración («Drama · 1 h 52 min») y el precio («5,50 €»);
//   - una Sesión por cada sesión, en una lista; o, si no tiene, «Sin sesiones esta semana»;
//   - y, para el filtro del bloque B, la edad y los días de sus sesiones en atributos data-*.
export function TarjetaPelicula({
  id = "luz-caleta",
  titulo = "La luz de la Caleta",
  genero = "Drama",
  duracion = 112,
  edad = "7",
  precio = 5.5,
  poster = "/posters/luz-caleta",
  sesiones = [],
} = {}) {
  // ✍️ aquí
  return `<article>✍️ A3 ${id} ${titulo} ${genero} ${duracion} ${edad} ${precio} ${poster} ${sesiones.length}</article>`;
}
