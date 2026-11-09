// compra.stories.js — 👀 ya está hecho.
import { PaginaCompra, activarPaginaCompra } from "./compra.js";
import { montar } from "../../../utilidades/montar.js";

export default {
  title: "Páginas/Comprar entradas",
  render: () => montar(PaginaCompra(), activarPaginaCompra),
  parameters: { layout: "fullscreen" },
};

export const Normal = {};
