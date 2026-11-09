// cartelera.js — 👀 ya está hecho. Pinta la página Cartelera (A) y le pone el comportamiento (B).
import "../scss/main.scss";
import { PaginaCartelera, activarCartelera } from "./components/paginas/cartelera/cartelera.js";

const app = document.querySelector("#app");
app.innerHTML = PaginaCartelera();
activarCartelera(app);
