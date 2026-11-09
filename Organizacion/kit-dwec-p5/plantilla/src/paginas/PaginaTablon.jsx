// ✍️ C3 · PaginaTablon (ruta /misiones): las misiones de la API, con TU Buscador del bloque B.
//    · Pide "/api/misiones" con TU useFetch.
//    · Mientras carga: <p className="cargando" role="status">Cargando misiones…</p>
//    · Si hay error:   <p className="error" role="alert">No se ha podido cargar el tablón (Error 500)</p>
//    · Si no: <h2>Tablón de misiones</h2> y <Buscador misiones={…} onElegir={…} />. Al elegir una misión, se va a su
//      página, /misiones/<id>, con useNavigate. (Esa función, con useCallback: es la que recibe el Buscador).
import { useCallback } from "react";
import { useNavigate } from "react-router";
import useFetch from "../hooks/useFetch.js";
import Buscador from "../tablon/Buscador.jsx";

export default function PaginaTablon() {
  throw new Error("Sin hacer");
}
