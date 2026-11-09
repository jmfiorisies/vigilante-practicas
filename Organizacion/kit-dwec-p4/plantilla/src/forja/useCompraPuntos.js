// ✍️ B3 · useCompraPuntos(): un hook propio con el reparto de los 27 puntos.
//    Estado: las puntuaciones, que empiezan todas en 8 ({ fue: 8, des: 8, … }).
//    Devuelve { puntuaciones, restantes, puedeSubir, puedeBajar, subir, bajar, reiniciar }:
//      · restantes        → los puntos que quedan (se CALCULAN con tu restantes(), no se guardan en otro estado)
//      · puedeSubir(clave) → si no está en MAXIMO (15) y lo que cuesta el siguiente punto cabe en lo que queda
//                            (de 13 a 14 cuesta 2: COSTE[14] − COSTE[13])
//      · puedeBajar(clave) → si no está en MINIMO (8)
//      · subir(clave), bajar(clave) → +1 o −1 a ese atributo SI SE PUEDE; si no, nada. Un objeto NUEVO (inmutable)
//      · reiniciar()      → todo a 8
import { useState } from "react";
import { ATRIBUTOS, COSTE, MAXIMO, MINIMO } from "../datos/reglas.js";
import { restantes } from "../logica/reglas.js";

const INICIAL = Object.fromEntries(ATRIBUTOS.map((a) => [a.clave, MINIMO]));

export default function useCompraPuntos() {
  throw new Error("Sin hacer");
}
