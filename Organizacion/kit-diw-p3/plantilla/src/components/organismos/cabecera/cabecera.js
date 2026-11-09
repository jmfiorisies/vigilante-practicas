// cabecera.js — 👀 ya está hecho. El organismo Cabecera: el nombre del cine y el menú, con la página actual marcada.
export function Cabecera({ actual = "cartelera" } = {}) {
  const enlace = (id, href, texto) =>
    `<li><a class="cabecera__enlace" href="${href}"${id === actual ? ' aria-current="page"' : ""}>${texto}</a></li>`;
  return `<header class="cabecera">
  <a class="cabecera__marca" href="/">Cine Bahía</a>
  <nav class="cabecera__menu" aria-label="Principal">
    <ul class="cabecera__lista">
      ${enlace("cartelera", "/", "Cartelera")}
      ${enlace("compra", "/compra.html", "Comprar entradas")}
    </ul>
  </nav>
</header>`;
}
