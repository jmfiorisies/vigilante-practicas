// fechas.js — Utilidades de fechas con objetos nativos (apartado 10 de la UD4).

/**
 * "2026-10-23" → Date del 23/10/2026 a las 00:00 en hora LOCAL.
 * ⚠️ new Date("2026-10-23") la interpreta en UTC: en España sería el 23 a las 02:00 (o el 22 en
 * otros husos). Por eso se parte a mano.
 */
export function parsearFecha(texto) {
  if (texto instanceof Date)
    return new Date(texto.getFullYear(), texto.getMonth(), texto.getDate());
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(texto));
  if (!m) throw new TypeError(`Fecha no válida: ${texto} (usa AAAA-MM-DD)`);
  const fecha = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (fecha.getMonth() !== Number(m[2]) - 1) throw new RangeError(`Esa fecha no existe: ${texto}`);
  return fecha;
}

/** La fecha a las 00:00 (para comparar días sin que estorben las horas) */
export const soloDia = (fecha) => new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());

/** Date → "23/10/2026" */
export const formatear = (fecha) =>
  fecha.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
