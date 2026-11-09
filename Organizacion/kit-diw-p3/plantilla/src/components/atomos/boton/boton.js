// boton.js — 👀 EJEMPLO RESUELTO. El átomo Botón.
// Un componente es una FUNCIÓN: recibe un objeto con sus propiedades (props) y devuelve el HTML como texto.
// Cada propiedad tiene un valor por defecto (= …), así Boton() sin nada también funciona.
//
//   Boton({ texto: "Comprar entradas" })                        → botón primario
//   Boton({ texto: "Ver el tráiler", variante: "secundario" })  → botón secundario
//   Boton({ texto: "Pagar", tipo: "submit" })                  → botón de enviar un formulario
export function Boton({
  texto = "Botón",
  variante = "primario", // primario | secundario | fantasma
  tamano = "normal", // normal | grande
  desactivado = false,
  tipo = "button", // button | submit
  icono = "", // el HTML de un Icono (opcional)
  soloIcono = false, // true → el texto solo lo oye el lector de pantalla
  clases = "", // clases extra de quien lo usa (la mezcla BEM de la UD5)
} = {}) {
  const lista = ["boton", `boton--${variante}`];
  if (tamano === "grande") lista.push("boton--grande");
  if (clases) lista.push(clases);
  const rotulo = soloIcono ? `<span class="visualmente-oculto">${texto}</span>` : texto;
  return `<button type="${tipo}" class="${lista.join(" ")}"${desactivado ? " disabled" : ""}>${icono}${rotulo}</button>`;
}
