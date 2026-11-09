// .storybook/preview.js — 👀 ya está hecho. Lo que se carga ANTES de pintar cada historia.
import "../scss/main.scss"; // los estilos de Cine Bahía (tokens + un .scss por componente)

export default {
  parameters: {
    layout: "padded", // un poco de margen alrededor del componente
    controls: { expanded: true }, // los controles con su descripción
    options: {
      // el menú en el orden de Atomic Design (si no, sale por orden alfabético)
      storySort: { order: ["Átomos", "Moléculas", "Organismos", "Plantillas", "Páginas"] },
    },
    a11y: { test: "todo" }, // la pestaña Accessibility avisa, pero no rompe nada
    viewport: {
      options: {
        movil: { name: "Móvil (360 px)", styles: { width: "360px", height: "740px" } },
        tableta: { name: "Tableta (768 px)", styles: { width: "768px", height: "1024px" } },
        escritorio: { name: "Escritorio (1280 px)", styles: { width: "1280px", height: "800px" } },
      },
    },
  },
};
