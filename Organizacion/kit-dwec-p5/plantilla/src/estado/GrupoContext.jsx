// ✍️ D2 · El grupo, global: Context + useReducer con TU grupoReducer (UD12, apartado 5). Mira SesionContext (👀).
//    · GrupoProvider({ children, inicial = GRUPO_INICIAL }): useReducer(grupoReducer, inicial) y da a los de dentro:
//        { aceptadas, oro, completadas, lleno, aceptar(mision), abandonar(id), completar(id) }
//      lleno es true si ya hay MAX_ACEPTADAS. aceptar/abandonar/completar hacen dispatch de su acción.
//    · useGrupo(): lee el GrupoContext. Fuera de un GrupoProvider, lanza
//        new Error("useGrupo tiene que usarse dentro de <GrupoProvider>")
//    · Y en src/main.jsx, envuelve la App en <GrupoProvider> (dentro de SesionProvider).
import { createContext, useContext, useReducer } from "react";
import { MAX_ACEPTADAS } from "../datos/gremio.js";
import { GRUPO_INICIAL, grupoReducer } from "./grupoReducer.js";

export const GrupoContext = createContext(null); // la caja (ya está): no la cambies

export function GrupoProvider({ children, inicial = GRUPO_INICIAL }) {
  throw new Error("Sin hacer");
}

export function useGrupo() {
  throw new Error("Sin hacer");
}
