// 👀 B0 · Ejemplo resuelto: un dado con ESTADO. useState guarda la última tirada (null: aún no se ha tirado).
//    Al pulsar, setTirada(…) guarda un valor nuevo y React vuelve a pintar el componente con él.
import { useState } from "react";
import { tirar } from "../logica/reglas.js";

export default function TiradaDado({ caras = 20 }) {
  const [tirada, setTirada] = useState(null);
  return (
    <div className="dado">
      <button onClick={() => setTirada(tirar(caras))}>🎲 Tirar d{caras}</button>
      <output>{tirada ?? "—"}</output>
      {tirada === caras && <span className="critico">¡Crítico!</span>}
    </div>
  );
}
