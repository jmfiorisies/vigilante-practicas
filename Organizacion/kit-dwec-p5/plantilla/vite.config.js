// vite.config.js — Vite sirve la página en http://localhost:5173 (dentro de Docker) y entiende JSX gracias al plugin
// de React. Lo que empieza por /api lo pasa a la API (el servicio «api» de compose.yaml). Vitest pasa las pruebas de
// tests/ en un navegador sin ventana (happy-dom). No hace falta tocarlo.
import react from "@vitejs/plugin-react";

export default {
  plugins: [react()],
  server: {
    host: "0.0.0.0", // para poder abrirla desde tu navegador, fuera del contenedor
    port: 5173,
    strictPort: true,
    // En Windows y Mac, Docker no siempre avisa de que has guardado: así Vite lo mira él mismo
    watch: { usePolling: true, interval: 300, ignored: ["**/api/db.json"] },
    // fetch("/api/misiones") → http://api:3000/misiones (mismo origen para el navegador: sin problemas de CORS)
    proxy: { "/api": { target: "http://api:3000", rewrite: (ruta) => ruta.replace(/^\/api/, "") } },
  },
  test: { environment: "happy-dom", include: ["tests/**/*.test.jsx"], setupFiles: ["tests/preparar.js"] },
};
