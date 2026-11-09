// 👀 D0 · Ejemplo resuelto: la sesión del aventurero en un Context (UD12, apartados 3 y 6). Tu GrupoContext es parecido.
//    · SesionContext: la «caja». SesionProvider la llena; useSesion() la lee desde cualquier componente de dentro.
//    · El valor: { aventurero, entrar(datos), salir() }. aventurero es null o { nombre, clase, nivel }.
//    · La prop inicial sirve para las pruebas (empezar ya con alguien dentro).
import { createContext, useContext, useState } from "react";

export const SesionContext = createContext(null);

export function SesionProvider({ children, inicial = null }) {
  const [aventurero, setAventurero] = useState(inicial);
  const valor = { aventurero, entrar: setAventurero, salir: () => setAventurero(null) };
  return <SesionContext value={valor}>{children}</SesionContext>;
}

export function useSesion() {
  const valor = useContext(SesionContext);
  if (!valor) throw new Error("useSesion tiene que usarse dentro de <SesionProvider>");
  return valor;
}
