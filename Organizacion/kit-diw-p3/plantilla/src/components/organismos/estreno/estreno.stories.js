// estreno.stories.js — 👀 ya está hecho.
import { Estreno } from "./estreno.js";
import { activarTrailer } from "../../moleculas/trailer/trailer.interaccion.js";
import { montar } from "../../../utilidades/montar.js";

export default {
  title: "Organismos/Estreno de la semana",
  render: () => montar(Estreno(), activarTrailer),
};

export const Normal = {};
