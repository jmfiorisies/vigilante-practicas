// cartelera.js — 👀 ya está hecho. Los datos de la semana de Cine Bahía (en un cine de verdad vendrían de un servidor).
// edad: "tp" (todos los públicos), "7", "12", "16" o "18" · duracion: en minutos · precio: en euros · dia: vie, sab o dom
export const DIAS = { vie: "Viernes", sab: "Sábado", dom: "Domingo" };

export const peliculas = [
  {
    id: "luz-caleta",
    titulo: "La luz de la Caleta",
    genero: "Drama",
    duracion: 112,
    edad: "7",
    precio: 5.5,
    poster: "/posters/luz-caleta",
    sesiones: [
      { id: "lc-vie", dia: "vie", hora: "21:30", sala: "Patio" },
      { id: "lc-sab", dia: "sab", hora: "22:00", sala: "Patio", formato: "VOSE" },
    ],
  },
  {
    id: "pulpo-jacinta",
    titulo: "Pulpo y Jacinta",
    genero: "Animación",
    duracion: 88,
    edad: "tp",
    precio: 4,
    poster: "/posters/pulpo-jacinta",
    sesiones: [
      { id: "pj-sab", dia: "sab", hora: "20:00", sala: "Patio" },
      { id: "pj-dom", dia: "dom", hora: "19:30", sala: "Terraza", formato: "3D" },
    ],
  },
  {
    id: "levante",
    titulo: "Levante",
    genero: "Suspense",
    duracion: 104,
    edad: "16",
    precio: 5.5,
    poster: "/posters/levante",
    sesiones: [
      { id: "le-vie", dia: "vie", hora: "23:45", sala: "Terraza" },
      { id: "le-sab", dia: "sab", hora: "23:45", sala: "Terraza", formato: "VOSE" },
    ],
  },
  {
    id: "ultimo-tranvia",
    titulo: "El último tranvía",
    genero: "Comedia",
    duracion: 97,
    edad: "12",
    precio: 5.5,
    poster: "/posters/ultimo-tranvia",
    sesiones: [{ id: "ut-dom", dia: "dom", hora: "21:30", sala: "Patio" }],
  },
  {
    id: "mareas-vivas",
    titulo: "Mareas vivas",
    genero: "Documental",
    duracion: 60,
    edad: "tp",
    precio: 3,
    poster: "/posters/mareas-vivas",
    sesiones: [],
  },
];

// La sala del Patio: 6 filas (A–F) de 8 butacas. Las ocupadas, ya vendidas.
export const sala = {
  filas: ["A", "B", "C", "D", "E", "F"],
  porFila: 8,
  ocupadas: ["A1", "A2", "C4", "C5", "D4", "F8"],
};

// El estreno de la semana, con su tráiler
export const estreno = {
  pelicula: "luz-caleta",
  texto: "Una fotógrafa vuelve a su barrio el verano en que van a cerrar el balneario. Rodada en Cádiz.",
  trailer: { webm: "/trailers/luz-caleta.webm", mp4: "/trailers/luz-caleta.mp4", vtt: "/trailers/luz-caleta.vtt" },
};
