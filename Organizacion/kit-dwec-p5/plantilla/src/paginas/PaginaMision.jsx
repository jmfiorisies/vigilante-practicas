// ✍️ C3 · PaginaMision (ruta /misiones/:id): una misión. El id sale de la dirección, con useParams.
//    · Pide "/api/misiones/<id>" con TU useFetch.
//    · Mientras carga: <p className="cargando" role="status">Cargando misión…</p>
//    · Si el error es "Error 404": <h2>Esa misión no existe</h2> y un <Link> «Volver al tablón» (a /misiones).
//    · Con otro error: <p className="error" role="alert">No se ha podido cargar la misión (Error 500)</p>
//    · Si no:
//      <article className="detalle-mision">
//        <h2>Cazar un basilisco joven</h2>
//        <p>Rango S · Ciénaga Negra</p>
//        <p>💰 1500 de oro · 👥 4 plazas</p>
//        <p className="descripcion">Traed antorchas.</p>   ← solo si tiene descripción
//        (✍️ D4: aquí, <BotonAceptar mision={…} />)
//        <Link to="/misiones">← Volver al tablón</Link>
//      </article>
import { Link, useParams } from "react-router";
import BotonAceptar from "../estado/BotonAceptar.jsx";
import useFetch from "../hooks/useFetch.js";

export default function PaginaMision() {
  throw new Error("Sin hacer");
}
