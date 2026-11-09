// trailer.stories.js — 👀 ya está hecho. Con su interacción: pulsa el botón y sale el vídeo (cuando hagas el ✍️ B4).
import { Trailer } from "./trailer.js";
import { activarTrailer } from "./trailer.interaccion.js";
import { montar } from "../../../utilidades/montar.js";

export default {
  title: "Moléculas/Tráiler",
  tags: ["autodocs"],
  render: (args) => montar(Trailer(args), activarTrailer),
  args: { titulo: "La luz de la Caleta" },
  argTypes: { titulo: { control: "text", description: "El título (sale en el botón)" } },
};

export const Normal = {};
