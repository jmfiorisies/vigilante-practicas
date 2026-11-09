// arranque.js — Bloque C · 👀 C7 (RESUELTO: léelo). Une las tres unidades: datos (UD6) → modelo (UD4) → interfaz (UD5).
import { arrancar, guardarTablero } from "./datos/persistencia.js";
import { iniciarApp } from "./ui/app.js";

/** Enseña «Cargando…», arranca el tablero, avisa si algo falló y guarda tras cada cambio */
export async function iniciar(raiz, { storage = localStorage, hoy = null, ...opciones } = {}) {
  const estado = raiz.querySelector("#estado");
  estado.textContent = "Cargando tareas…";
  estado.hidden = false;

  const { tablero, origen, error } = await arrancar({ storage, ...opciones });

  if (error) estado.textContent = `No se han podido cargar las tareas iniciales (${error}).`;
  else estado.hidden = true;
  guardarTablero(tablero, storage);
  iniciarApp(raiz, tablero, { hoy, alCambiar: (t) => guardarTablero(t, storage) });
  return { tablero, origen };
}
