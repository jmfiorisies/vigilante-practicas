// ✍️ A5 · Ficha({ personaje }): la ficha entera, JUNTANDO tus componentes. personaje es como BRENNA (datos/ejemplo.js):
//    { nombre, razaId, claseId, puntuaciones, pv }. La raza y la clase se buscan con buscar(RAZAS, …) y
//    buscar(CLASES, …): pueden no estar (en el bloque B, mientras no se ha elegido).
//
//    <article className="ficha">
//      <header>
//        <h2>Brenna Piedrahonda</h2>                ← el nombre, o «Sin nombre» si está vacío
//        <p>Enano · Guerrero · Nivel 1</p>          ← «?» en lugar de la raza o la clase que no esté
//      </header>
//      <BloqueAtributos … />
//      <p className="pv">❤️ 13 PV</p>
//      <ListaRasgos titulo="Rasgos de Enano" … />    ← solo si hay raza
//      <ListaRasgos titulo="Rasgos de Guerrero" … /> ← solo si hay clase
//    </article>
import { buscar, CLASES, RAZAS } from "../datos/reglas.js";
import BloqueAtributos from "./BloqueAtributos.jsx";
import ListaRasgos from "./ListaRasgos.jsx";

export default function Ficha({ personaje }) {
  throw new Error("Sin hacer");
}
