// main.jsx — El punto de entrada: monta <App /> en el <div id="root"> de index.html, dentro del router (las rutas) y
// de la sesión (👀 D0). ✍️ D2: envuelve también en tu <GrupoProvider>, dentro de <SesionProvider>.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App.jsx";
import { SesionProvider } from "./estado/SesionContext.jsx";
import "./estilos.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <SesionProvider>
        <App />
      </SesionProvider>
    </BrowserRouter>
  </StrictMode>,
);
