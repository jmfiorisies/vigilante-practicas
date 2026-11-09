// accesibilidad.js — 👀 ya está hecho. La página de la declaración de accesibilidad: pinta tu declaracion.md (✍️ B3)
// tal cual, para que veas cómo la leería un paciente.
import "../scss/main.scss";
import texto from "../declaracion.md?raw";

/** Un Markdown muy sencillo → HTML: títulos (#, ##), listas (-), párrafos y **negrita** */
function aHtml(md) {
  const escapar = (t) =>
    t
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  return md
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter((b) => b && !b.startsWith(">"))
    .map((b) => {
      if (b.startsWith("## ")) return `<h2>${escapar(b.slice(3))}</h2>`;
      if (b.startsWith("# ")) return `<h1>${escapar(b.slice(2))}</h1>`;
      if (b.startsWith("- "))
        return `<ul>${b
          .split(/\n- /)
          .map((l) => `<li>${escapar(l.replace(/^- /, ""))}</li>`)
          .join("")}</ul>`;
      return `<p>${escapar(b)}</p>`;
    })
    .join("\n");
}

document.querySelector("#contenido").innerHTML = aHtml(texto);
