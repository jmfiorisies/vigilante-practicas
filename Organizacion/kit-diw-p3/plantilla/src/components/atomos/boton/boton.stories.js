// boton.stories.js — 👀 EJEMPLO RESUELTO. Las historias (stories) del Botón.
// El «export default» describe el COMPONENTE: dónde sale en el menú, cómo se pinta y qué controles tiene.
// Cada «export const» es UNA HISTORIA: un estado concreto del componente (una variante).
import { Boton } from "./boton.js";

export default {
  title: "Átomos/Botón", // nivel de Atomic Design / nombre → el árbol del menú de Storybook
  tags: ["autodocs"], // crea la página «Docs» con la tabla de propiedades
  render: (args) => Boton(args), // cómo se pinta: se llama a la función con los args
  args: { texto: "Comprar entradas", variante: "primario", tamano: "normal", desactivado: false },
  argTypes: {
    variante: {
      control: "select",
      options: ["primario", "secundario", "fantasma"],
      description: "Aspecto del botón (sale de la guía de estilo)",
    },
    tamano: { control: "inline-radio", options: ["normal", "grande"], description: "Tamaño" },
    desactivado: { control: "boolean", description: "Pone el atributo disabled" },
    texto: { control: "text", description: "Lo que pone el botón" },
    // Estas no se tocan desde el panel: se quitan de los controles
    tipo: { table: { disable: true } },
    icono: { table: { disable: true } },
    soloIcono: { table: { disable: true } },
    clases: { table: { disable: true } },
  },
};

export const Primario = {};
export const Secundario = { args: { variante: "secundario", texto: "Ver el tráiler" } };
export const Fantasma = { args: { variante: "fantasma", texto: "Cancelar" } };
export const Grande = { args: { tamano: "grande" } };
export const Desactivado = { args: { desactivado: true, texto: "Agotado" } };
