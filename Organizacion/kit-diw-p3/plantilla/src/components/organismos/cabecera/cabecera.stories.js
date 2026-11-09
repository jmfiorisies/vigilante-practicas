// cabecera.stories.js — 👀 ya está hecho.
import { Cabecera } from "./cabecera.js";

export default {
  title: "Organismos/Cabecera",
  tags: ["autodocs"],
  render: (args) => Cabecera(args),
  args: { actual: "cartelera" },
  argTypes: {
    actual: { control: "inline-radio", options: ["cartelera", "compra"], description: "La página en la que estás" },
  },
  parameters: { layout: "fullscreen" },
};

export const EnLaCartelera = {};
export const EnLaCompra = { args: { actual: "compra" } };
