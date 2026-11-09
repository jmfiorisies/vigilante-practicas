// vite.config.mjs — 👀 ya está hecho. Dos páginas: la cartelera (index.html) y la compra (compra.html).
import { defineConfig } from "vite";

export default defineConfig({
  css: { devSourcemap: true }, // F12 muestra el .scss y la línea de cada regla
  build: { rollupOptions: { input: { cartelera: "index.html", compra: "compra.html" } } },
  // server: { watch: { usePolling: true } },  // solo si al guardar no se actualiza (Docker Desktop en Windows)
});
