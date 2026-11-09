// filtro-cartelera.js — 👀 ya está hecho. La molécula Filtro de la cartelera: el día y la edad de quien va.
// Lo que hace al cambiar lo escribes en plantillas/cartelera/cartelera.interaccion.js (✍️ B1).
import { DIAS } from "../../../datos/cartelera.js";

export function FiltroCartelera() {
  const dias = Object.entries(DIAS)
    .map(([id, texto]) => `<option value="${id}">${texto}</option>`)
    .join("");
  return `<form class="filtro" role="search" aria-label="Filtrar la cartelera">
  <div class="filtro__campo">
    <label for="filtro-dia">Día</label>
    <select class="filtro__dia" id="filtro-dia" name="dia">
      <option value="">Todos los días</option>${dias}
    </select>
  </div>
  <div class="filtro__campo">
    <label for="filtro-edad">¿Quién va?</label>
    <select class="filtro__edad" id="filtro-edad" name="edad">
      <option value="">Cualquier edad</option>
      <option value="tp">Con niños pequeños (solo TP)</option>
      <option value="7">Con niños de 7 años o más</option>
      <option value="12">Con mayores de 12</option>
      <option value="16">Con mayores de 16</option>
    </select>
  </div>
  <button type="submit" class="boton boton--secundario filtro__aplicar">Filtrar</button>
</form>`;
}
