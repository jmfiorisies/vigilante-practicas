// vite.config.js — Vite sirve la página en http://localhost:5173 (dentro de Docker) y entiende JSX gracias al plugin
// de React. Vitest pasa las pruebas de tests/ en un navegador sin ventana (happy-dom). No hace falta tocarlo.
import react from "@vitejs/plugin-react";

export default {
  plugins: [react()],
  server: {
    host: "0.0.0.0", // para poder abrirla desde tu navegador, fuera del contenedor
    port: 5173,
    strictPort: true,
    watch: { usePolling: true, interval: 300 }, // en Windows y Mac, Docker no siempre avisa de que has guardado
  },
  test: { environment: "happy-dom", include: ["tests/**/*.test.jsx"], setupFiles: ["tests/preparar.js"] },
};
