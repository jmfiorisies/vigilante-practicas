// ✍️ A4 · TarjetaClase({ clase, elegida, children }): la tarjeta de una clase.
//    <article className="tarjeta-clase">   ← y "tarjeta-clase elegida" si elegida es true
//      <h3>⚔️ Guerrero</h3>                  ← el icono, un espacio y el nombre
//      <Etiqueta tipo="dado">d10</Etiqueta>  ← el dado de golpe
//      <Etiqueta tipo="ok">Elegida</Etiqueta>   ← SOLO si elegida
//      …children…                           ← lo que venga dentro (en el bloque B, un botón)
//    </article>
import Etiqueta from "./Etiqueta.jsx";

export default function TarjetaClase({ clase, elegida = false, children }) {
  throw new Error("Sin hacer");
}
