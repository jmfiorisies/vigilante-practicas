// almacen.js — Bloque C · 👀 EJEMPLO RESUELTO. localStorage solo guarda TEXTO: JSON de ida y vuelta.
// storage se puede pasar (para los tests); por defecto, el localStorage del navegador.

export function guardar(clave, valor, storage = localStorage) {
  storage.setItem(clave, JSON.stringify(valor));
}

/** El valor guardado, o porDefecto si no hay nada o lo guardado no es JSON válido (no revienta) */
export function cargar(clave, porDefecto = null, storage = localStorage) {
  const texto = storage.getItem(clave); // null si no existe
  if (texto === null) return porDefecto;
  try {
    return JSON.parse(texto);
  } catch {
    return porDefecto;
  }
}

export function borrar(clave, storage = localStorage) {
  storage.removeItem(clave);
}
