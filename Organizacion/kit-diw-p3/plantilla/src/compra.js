// compra.js — 👀 ya está hecho. Pinta la página Comprar entradas con la película y la sesión de la dirección.
import "../scss/main.scss";
import { PaginaCompra, activarPaginaCompra, elegir } from "./components/paginas/compra/compra.js";

const app = document.querySelector("#app");
app.innerHTML = PaginaCompra(elegir(location.search));
activarPaginaCompra(app);
