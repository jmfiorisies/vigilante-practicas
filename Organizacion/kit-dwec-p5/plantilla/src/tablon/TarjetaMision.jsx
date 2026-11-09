// ✍️ B1 · TarjetaMision({ mision, elegida, compacta, onElegir }): una misión del tablón.
//    · En la PRIMERA línea, contar("TarjetaMision") (así se miden sus renders).
//    · Se exporta envuelta en memo (UD10, apartado 8): si sus props son las mismas, no se vuelve a pintar.
//    <article className="tarjeta-mision">                 ← y "tarjeta-mision elegida" si elegida es true
//      <span className="rango rango--S">S</span>          ← el rango (con su clase: rango--E, rango--D…)
//      <h3>Cazar un basilisco joven</h3>
//      <p className="datos">💰 1500 de oro · 📍 Ciénaga Negra · 👥 4 plazas</p>   ← NO sale si compacta es true
//      <button aria-label="Ver Cazar un basilisco joven">Ver</button>              ← al pulsar, onElegir(mision.id)
//    </article>
import { memo } from "react";
import { contar } from "./medir.js";

export default function TarjetaMision({ mision, elegida = false, compacta = false, onElegir }) {
  throw new Error("Sin hacer");
}

// ✍️ Y al final, en vez de «export default function»: export default memo(TarjetaMision);
