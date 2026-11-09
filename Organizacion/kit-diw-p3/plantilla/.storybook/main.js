// .storybook/main.js — 👀 ya está hecho. Le dice a Storybook DÓNDE están las historias y CON QUÉ las pinta.
export default {
  // 1. Las historias: cualquier fichero *.stories.js dentro de src/components (de cualquier nivel)
  stories: ["../src/components/**/*.stories.js"],
  // 2. El «framework»: HTML + Vite. Nuestros componentes son funciones JS que devuelven HTML (nada de React)
  framework: { name: "@storybook/html-vite", options: {} },
  // 3. Los complementos: documentación automática y revisión de accesibilidad
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  // 4. Ficheros estáticos: public/ se sirve en la raíz (/posters/…, /trailers/…)
  staticDirs: ["../public"],
  // 5. Sin avisos de Storybook en clase (la lista «Get started» y las novedades de cada versión)
  core: { disableWhatsNewNotifications: true },
  features: { sidebarOnboardingChecklist: false, menuOnboardingChecklist: false },
};
