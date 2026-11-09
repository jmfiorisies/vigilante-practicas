// formulario.js — Bloque B · 👀 leerFormulario (RESUELTO) y ✍️ B2 (mostrarErrores).

// 👀 Resuelto. Del formulario TODO llega como texto: aquí se limpia y se convierte.
/**
 * Lee el formulario de alta y devuelve los datos LIMPIOS para el modelo:
 * { titulo, prioridad, limite, cadaDias }. Texto sin espacios de más, limite "AAAA-MM-DD" o null,
 * cadaDias un número o undefined (si está vacío).
 */
export function leerFormulario(form) {
  const campos = Object.fromEntries(new FormData(form));
  const datos = {
    titulo: (campos.titulo ?? "").trim(),
    prioridad: campos.prioridad,
    limite: campos.limite ? campos.limite : null,
  };
  if (campos.cadaDias?.trim()) datos.cadaDias = Number(campos.cadaDias);
  return datos;
}

// ✍️ B2 · mostrarErrores(form, errores)   errores = { campo: "mensaje" }
//   - Recorre los <p data-error-de="campo"> del formulario (querySelectorAll)
//   - Si ese campo tiene error: el mensaje en el <p> y aria-invalid="true" en el control
//     (el control es form.elements[campo])
//   - Si no lo tiene: <p> vacío y SIN aria-invalid (removeAttribute)
//   Pista: p.dataset.errorDe es el nombre del campo (data-error-de → dataset.errorDe)
export function mostrarErrores(form, errores) {
  throw new Error("Sin hacer");
}
