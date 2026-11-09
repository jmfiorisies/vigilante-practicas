// ✍️ B5 · Forja: crear el héroe. AQUÍ vive el estado (levantado): el nombre, la raza, la clase y la compra de puntos.
//    Lo demás se CALCULA en cada render (estado derivado), no se guarda:
//      raza y clase      → buscar(RAZAS, razaId), buscar(CLASES, claseId)
//      finales           → aplicarRaza(puntuaciones, raza)
//      pv                → puntosDeGolpe(clase, finales.con)
//      lo que falta      → «el nombre», «la raza», «la clase», «gastar N puntos»
//
//    <div className="forja">
//      <section className="opciones">
//        <label>Nombre <input /></label>                         ← controlado: value={nombre}
//        <label>Raza <select>…</select></label>                 ← controlado; la primera opción, value="" «— Elige —»
//        <p className="puntos">Puntos: 27 de 27</p>             ← los que quedan
//        un <ControlAtributo> por atributo (ATRIBUTOS), con la compra de tu useCompraPuntos
//        <ElegirClase elegida={…} onElegir={…} />
//        <button>Reiniciar</button>                            ← todo como al principio
//      </section>
//      <section className="vista">
//        <p className="falta">Te falta: el nombre, la raza, la clase, gastar 27 puntos</p>   ← mientras falte algo
//        <p className="listo" role="status">⚔️ ¡Brenna se une a la aventura!</p>     ← cuando no falte nada
//        <Ficha personaje={…} />                                ← tu ficha del bloque A, con los valores FINALES
//      </section>
//    </div>
import { useState } from "react";
import Ficha from "../componentes/Ficha.jsx";
import { ATRIBUTOS, buscar, CLASES, PUNTOS, RAZAS } from "../datos/reglas.js";
import { aplicarRaza, puntosDeGolpe } from "../logica/reglas.js";
import ControlAtributo from "./ControlAtributo.jsx";
import ElegirClase from "./ElegirClase.jsx";
import useCompraPuntos from "./useCompraPuntos.js";

export default function Forja() {
  throw new Error("Sin hacer");
}
