// ✍️ D3 · RutaPrivada({ children }): solo deja pasar con sesión (UD12, apartado 6).
//    · Con aventurero (useSesion): pinta children.
//    · Sin él: <Navigate to="/entrar" replace state={{ desde: <la ruta en la que estaba> }} /> (useLocation().pathname),
//      para que, al entrar, vuelva a donde iba.
import { Navigate, useLocation } from "react-router";
import { useSesion } from "./SesionContext.jsx";

export default function RutaPrivada({ children }) {
  throw new Error("Sin hacer");
}
