// ✍️ B2, B3 y B4 · Buscador({ misiones, onElegir }): buscar en cientos de misiones sin que vaya lento.
//    Estado: el texto, el rango ("" = todos), la vista compacta (true/false) y el id de la misión elegida (null).
//    <section className="buscador">
//      <label htmlFor="buscar">Buscar</label> <input id="buscar" />          ← controlado
//      <button aria-label="Limpiar búsqueda">✖</button>
//      <label htmlFor="filtro-rango">Rango</label> <select id="filtro-rango"> ← «Todos» (value "") y los RANGOS
//      <label><input type="checkbox" /> Vista compacta</label>
//      <p className="cuantas">12 misiones</p>
//      una TarjetaMision por misión visible (con key)  ·  o, si no hay ninguna, <p className="vacio">Ninguna misión con esos filtros</p>
//    </section>
//
//    B2 · Las visibles salen de filtrar(misiones, texto, rango) (medir.js), con useMemo: cambiar la vista compacta o
//         elegir una misión NO tiene que volver a filtrar.
//    B3 · Al pulsar «Ver» en una tarjeta: se guarda como elegida y se avisa con onElegir(id) (si llega). Esa función se
//         pasa a TODAS las tarjetas: con useCallback, al elegir una solo se vuelven a pintar las que cambian.
//    B4 · useRef al input: «Limpiar búsqueda» vacía el texto y devuelve el foco al input. Pulsar Escape en el input,
//         lo mismo.
import { useCallback, useMemo, useRef, useState } from "react";
import { RANGOS } from "../datos/gremio.js";
import { filtrar } from "./medir.js";
import TarjetaMision from "./TarjetaMision.jsx";

export default function Buscador({ misiones, onElegir }) {
  throw new Error("Sin hacer");
}
