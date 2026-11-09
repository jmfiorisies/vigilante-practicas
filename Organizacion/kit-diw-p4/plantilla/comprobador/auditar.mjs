// auditar.mjs — 👀 ya está hecho. Un TEST EXTERNO automático: pasa axe (el motor de Lighthouse) por las páginas del
// consultorio y dice qué criterios de WCAG 2.2 A y AA fallan.
//     docker compose run --rm web npm run auditar          (las cuatro páginas)
//     docker compose run --rm web npm run auditar cita     (solo una: inicio, cita, mi-cita o accesibilidad)
// Es como pa11y o axe-cli, pero sin abrir un navegador de verdad: por eso NO puede medir colores, tamaños,
// movimiento ni el ancho de la página. Eso, con el navegador (UD10).
import { PAGINAS, pintar, axe, criterios } from "./navegador.mjs";

const pedidas = process.argv.slice(2).filter((a) => PAGINAS[a]);
const claves = pedidas.length ? pedidas : Object.keys(PAGINAS);
const color = process.stdout.isTTY;
const c = (n, t) => (color ? `\x1b[${n}m${t}\x1b[0m` : t);
const IMPACTO = { critical: "crítico", serious: "grave", moderate: "moderado", minor: "leve" };

console.log(c(1, "\n🔎 Auditoría automática del Consultorio Los Alcatraces · axe, WCAG 2.2 A y AA\n"));
let total = 0;
for (const clave of claves) {
  console.log(c(1, `▸ ${PAGINAS[clave].titulo} (${PAGINAS[clave].html})`));
  try {
    await pintar(clave);
    const r = await axe();
    total += r.violations.length;
    if (!r.violations.length) console.log(c(32, "  ✔ ningún fallo que axe pueda ver"));
    for (const v of r.violations) {
      console.log(`  ${c(31, "✘")} ${c(1, v.id)} · ${criterios(v).join(", ") || "buena práctica"} · ${IMPACTO[v.impact] ?? v.impact} · ${v.nodes.length} elemento(s)`);
      console.log(c(2, `      ${v.help}`));
      for (const n of v.nodes.slice(0, 3)) console.log(c(2, `      → ${n.html.replace(/\s+/g, " ").slice(0, 110)}`));
    }
    const dudas = r.incomplete.filter((x) => x.nodes.length);
    if (dudas.length) console.log(c(33, `  • axe no ha podido decidir (revísalo tú en el navegador): ${dudas.map((x) => `${x.id} (${x.nodes.length})`).join(", ")}`));
  } catch (e) {
    console.log(c(31, `  ✘ no se puede auditar: ${e.message}`));
  }
  console.log();
}
console.log(c(1, `${total} tipo(s) de fallo en total.`));
console.log(c(2, "Un 0 aquí NO quiere decir «accesible»: falta lo que ninguna máquina ve (UD10).\n"));
setTimeout(() => process.exit(0), 50);
