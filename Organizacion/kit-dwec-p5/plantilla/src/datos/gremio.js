// datos/gremio.js — Las reglas del gremio. NO se tocan: las pruebas cuentan con ellas.
export const RANGOS = ["E", "D", "C", "B", "A", "S"]; // de la más fácil (E) a la más peligrosa (S)
export const REGIONES = [
  "Bosque Umbrío",
  "Montañas Grises",
  "Costa de Sal",
  "Ciénaga Negra",
  "Ciudad de Arkam",
];
export const CLASES = ["Guerrero", "Mago", "Pícaro", "Clérigo", "Bárbaro", "Bardo"];
export const MAX_ACEPTADAS = 3; // un grupo puede tener, como mucho, 3 misiones aceptadas a la vez
export const RECOMPENSA_ALTA = 500; // las misiones de rango A y S pagan, como mínimo, esto

const VERBOS = [
  "Escoltar",
  "Rescatar",
  "Cazar",
  "Explorar",
  "Recuperar",
  "Proteger",
  "Investigar",
  "Limpiar",
];
const COSAS = [
  "la caravana de especias",
  "al herrero perdido",
  "un grifo salvaje",
  "la cripta olvidada",
  "el amuleto robado",
  "el molino del norte",
  "los ruidos del pozo",
  "el nido de arañas",
  "al mensajero real",
  "la torre del alquimista",
  "un basilisco joven",
  "el faro abandonado",
];

// misionesDePrueba(n): n misiones inventadas, SIEMPRE las mismas (para medir el rendimiento con cientos de ellas).
export function misionesDePrueba(n) {
  let semilla = 7;
  const azar = (m) => {
    semilla = (semilla * 1103515245 + 12345) % 2147483648;
    return Math.floor(semilla / 65536) % m; // los bits altos: los bajos se repiten mucho
  };
  return Array.from({ length: n }, (_, i) => {
    const rango = RANGOS[azar(RANGOS.length)];
    const base = { E: 10, D: 40, C: 120, B: 250, A: 500, S: 1500 }[rango];
    return {
      id: String(i + 1),
      titulo: `${VERBOS[azar(VERBOS.length)]} ${COSAS[azar(COSAS.length)]}`,
      rango,
      region: REGIONES[azar(REGIONES.length)],
      recompensa: base + azar(10) * Math.ceil(base / 10),
      plazas: 1 + azar(6),
      descripcion: "",
    };
  });
}
