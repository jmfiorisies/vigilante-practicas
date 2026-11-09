// selector-butacas.stories.js — 👀 ya está hecho. Con una prueba de interacción (play) ya escrita: pasa en verde
// cuando el ✍️ B2 funciona. Míralo en la pestaña Interactions de Storybook.
import { expect, userEvent, within } from "storybook/test";
import { SelectorButacas } from "./selector-butacas.js";
import { activarButacas } from "./selector-butacas.interaccion.js";
import { montar } from "../../../utilidades/montar.js";

export default {
  title: "Organismos/Selector de butacas",
  tags: ["autodocs"],
  render: (args) => montar(SelectorButacas(args), activarButacas),
  args: { precio: 5.5 },
  argTypes: {
    precio: { control: { type: "number", min: 0, step: 0.5 }, description: "El precio de cada entrada, en euros" },
  },
};

export const Normal = {};

export const EligeDosButacas = {
  name: "Elige dos butacas",
  play: async ({ canvasElement }) => {
    const lienzo = within(canvasElement);
    await userEvent.click(lienzo.getByRole("button", { name: "A3" }));
    await userEvent.click(lienzo.getByRole("button", { name: "A4" }));
    await expect(lienzo.getByRole("button", { name: "A3" })).toHaveAttribute("aria-pressed", "true");
    await expect(lienzo.getByRole("status")).toHaveTextContent("2 butacas: A3, A4");
  },
};
