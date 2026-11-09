// vite.config.mjs — 👀 ya está hecho. Cuatro páginas: inicio, pedir cita, mi cita y la declaración de accesibilidad.
import { defineConfig } from "vite";

export default defineConfig({
  css: { devSourcemap: true }, // F12 muestra el .scss y la línea de cada regla
  build: {
    rollupOptions: {
      input: { inicio: "index.html", cita: "cita.html", micita: "mi-cita.html", accesibilidad: "accesibilidad.html" },
    },
  },
  // server: { watch: { usePolling: true } },  // solo si al guardar no se actualiza (Docker Desktop en Windows)
});
