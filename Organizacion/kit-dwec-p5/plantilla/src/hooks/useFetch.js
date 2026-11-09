// ✍️ C2 · useFetch(url): pedir datos desde un componente (UD11, apartados 3, 6 y 6.1).
//   · Devuelve { datos, cargando, error }. Al empezar (y cada vez que cambia la url): { datos: null, cargando: true, error: null }.
//   · Si sale bien: { datos: <el JSON>, cargando: false, error: null }.
//   · Si el servidor contesta mal (404, 500…): { datos: null, cargando: false, error: "Error 404" }.
//   · Al cambiar la url o desmontar, CANCELA la petición vieja: AbortController y, en la limpieza, control.abort().
//     Una petición cancelada lanza un error con name "AbortError": ese no es un error de verdad (no lo guardes).
import { useEffect, useState } from "react";

export default function useFetch(url) {
  throw new Error("Sin hacer");
}
