// api.js — Hablar con la API del gremio (json-server: /api/misiones) — UD11, apartados 5 y 7.
// Cada función devuelve los datos ya leídos o LANZA new Error("Error <status>").
// ⚠️ fetch NO falla con un 404 o un 500: llegan como una respuesta normal con res.ok === false. Hay que mirarlo.

// 👀 C0 · Ejemplo resuelto: todas las misiones.
export async function pedirMisiones() {
  const res = await fetch("/api/misiones");
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

// ✍️ C1 · Una misión por su id: GET /api/misiones/<id>. Si no existe, el servidor contesta 404 → new Error("Error 404").
export async function pedirMision(id) {
  throw new Error("Sin hacer");
}

// ✍️ C1 · Publicar una misión: POST /api/misiones con la misión en JSON (y la cabecera Content-Type: application/json).
//    Devuelve la misión que contesta el servidor, que trae su id nuevo. Si no contesta ok, new Error("Error <status>").
export async function publicarMision(mision) {
  throw new Error("Sin hacer");
}
