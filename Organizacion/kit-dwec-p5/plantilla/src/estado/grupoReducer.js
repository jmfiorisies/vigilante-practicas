// ✍️ D1 · grupoReducer(estado, accion): las misiones que ha aceptado tu grupo (UD12, apartado 4). Una función PURA:
//    devuelve un estado NUEVO, o EL MISMO objeto si la acción no cambia nada. Nunca cambia el que recibe.
//    Estado: { aceptadas: [misiones], oro: 0, completadas: 0 } (GRUPO_INICIAL).
//    · { tipo: "aceptar", mision }  → la añade al final. Si ya está (mismo id) o ya hay MAX_ACEPTADAS (3), nada.
//    · { tipo: "abandonar", id }    → la quita. Si no está, nada.
//    · { tipo: "completar", id }    → la quita, suma su recompensa al oro y 1 a completadas. Si no está, nada.
//    · Cualquier otro tipo          → lanza new Error("Acción desconocida: <tipo>").
import { MAX_ACEPTADAS } from "../datos/gremio.js";

export const GRUPO_INICIAL = { aceptadas: [], oro: 0, completadas: 0 };

export function grupoReducer(estado, accion) {
  throw new Error("Sin hacer");
}
