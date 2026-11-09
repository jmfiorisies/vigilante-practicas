// tarjeta-pelicula.stories.js — ✍️ A3. Las historias de la Tarjeta: el title en su nivel, los args de una película
// de verdad (src/datos/cartelera.js), un control de número para el precio y uno para la edad, la explicación de
// cada propiedad y tres historias como mínimo: una de ellas, sin sesiones.
import { TarjetaPelicula } from "./tarjeta-pelicula.js";

export default {
  title: "✍️ Pendiente/Tarjeta de película",
  render: (args) => TarjetaPelicula(args),
};

export const Pendiente = {};
