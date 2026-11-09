// main.jsx — El punto de entrada: monta <App /> en el <div id="root"> de index.html. No hace falta tocarlo.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./estilos.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
