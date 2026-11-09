// reglas.js — Las reglas del juego: atributos, razas y clases (una versión sencilla de las de la 5.ª edición).
// Son DATOS: no hace falta tocarlos (puedes añadir alguna raza o clase cuando todo funcione).

// Los seis atributos, en el orden de la ficha
export const ATRIBUTOS = [
  { clave: "fue", nombre: "Fuerza" },
  { clave: "des", nombre: "Destreza" },
  { clave: "con", nombre: "Constitución" },
  { clave: "int", nombre: "Inteligencia" },
  { clave: "sab", nombre: "Sabiduría" },
  { clave: "car", nombre: "Carisma" },
];

// Compra de puntos: cada atributo empieza en 8 y se sube hasta 15. Esto cuesta llegar a cada valor.
export const COSTE = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
export const PUNTOS = 27; // los puntos que hay para repartir
export const MINIMO = 8;
export const MAXIMO = 15;

// bonos: lo que suma la raza a cada atributo (DESPUÉS de la compra de puntos)
export const RAZAS = [
  {
    id: "humano",
    nombre: "Humano",
    bonos: { fue: 1, des: 1, con: 1, int: 1, sab: 1, car: 1 },
    velocidad: 9,
    rasgos: ["Versátil: +1 a todo", "Un idioma más"],
  },
  {
    id: "elfo",
    nombre: "Elfo",
    bonos: { des: 2 },
    velocidad: 9,
    rasgos: ["Visión en la oscuridad", "Trance: medita 4 horas en vez de dormir"],
  },
  {
    id: "enano",
    nombre: "Enano",
    bonos: { con: 2 },
    velocidad: 7.5,
    rasgos: ["Visión en la oscuridad", "Resistencia al veneno", "Afinidad con la piedra"],
  },
  {
    id: "mediano",
    nombre: "Mediano",
    bonos: { des: 2 },
    velocidad: 7.5,
    rasgos: ["Afortunado: repite los 1", "Valiente"],
  },
  {
    id: "semiorco",
    nombre: "Semiorco",
    bonos: { fue: 2, con: 1 },
    velocidad: 9,
    rasgos: ["Aguante implacable", "Ataques salvajes"],
  },
  {
    id: "draconido",
    nombre: "Dracónido",
    bonos: { fue: 2, car: 1 },
    velocidad: 9,
    rasgos: ["Arma de aliento", "Resistencia al daño de su linaje"],
  },
];

// dadoGolpe: las caras del dado de golpe (los puntos de golpe de nivel 1 = dadoGolpe + modificador de Constitución)
export const CLASES = [
  {
    id: "guerrero",
    nombre: "Guerrero",
    icono: "⚔️",
    dadoGolpe: 10,
    principal: "fue",
    rasgos: ["Estilo de combate", "Tomar aliento"],
  },
  {
    id: "mago",
    nombre: "Mago",
    icono: "🔮",
    dadoGolpe: 6,
    principal: "int",
    rasgos: ["Libro de conjuros", "Recuperación arcana"],
  },
  {
    id: "picaro",
    nombre: "Pícaro",
    icono: "🗡️",
    dadoGolpe: 8,
    principal: "des",
    rasgos: ["Ataque furtivo", "Pericia", "Jerga de ladrones"],
  },
  {
    id: "clerigo",
    nombre: "Clérigo",
    icono: "✨",
    dadoGolpe: 8,
    principal: "sab",
    rasgos: ["Conjuros divinos", "Dominio divino"],
  },
  {
    id: "barbaro",
    nombre: "Bárbaro",
    icono: "🪓",
    dadoGolpe: 12,
    principal: "fue",
    rasgos: ["Furia", "Defensa sin armadura"],
  },
  {
    id: "bardo",
    nombre: "Bardo",
    icono: "🎻",
    dadoGolpe: 8,
    principal: "car",
    rasgos: ["Inspiración bárdica", "Conjuros"],
  },
];

// Busca por id en una lista (RAZAS o CLASES). undefined si no está.
export const buscar = (lista, id) => lista.find((x) => x.id === id);
