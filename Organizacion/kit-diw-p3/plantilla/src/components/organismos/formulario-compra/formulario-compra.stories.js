// formulario-compra.stories.js — 👀 ya está hecho. Envíalo vacío para ver tus mensajes (cuando hagas el ✍️ B3).
import { FormularioCompra } from "./formulario-compra.js";
import { activarCompra } from "./formulario-compra.interaccion.js";
import { montar } from "../../../utilidades/montar.js";

export default {
  title: "Organismos/Formulario de compra",
  render: (args) => montar(FormularioCompra(args), activarCompra),
  args: { pelicula: "La luz de la Caleta", sesion: "Viernes 21:30 · Patio" },
};

export const Normal = {};
