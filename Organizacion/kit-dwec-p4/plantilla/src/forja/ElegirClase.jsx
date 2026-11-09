// ✍️ B4 · ElegirClase({ elegida, onElegir }): las clases para elegir, reutilizando tu TarjetaClase del bloque A.
//    <section className="clases"> con una <TarjetaClase> por cada clase de CLASES (con su key), marcada como
//    elegida si su id es «elegida». DENTRO de cada tarjeta (children), un botón:
//      <button aria-label="Elegir Guerrero">Elegir</button>  → al pulsar, onElegir("guerrero");
//                                                              desactivado en la que ya está elegida
import { CLASES } from "../datos/reglas.js";
import TarjetaClase from "../componentes/TarjetaClase.jsx";

export default function ElegirClase({ elegida, onElegir }) {
  throw new Error("Sin hacer");
}
