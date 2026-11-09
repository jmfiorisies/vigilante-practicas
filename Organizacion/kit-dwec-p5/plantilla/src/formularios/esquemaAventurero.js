// 👀 A0 · Ejemplo resuelto: el esquema de Zod de un aventurero (UD9, apartado 5). Las reglas, en UN solo sitio.
import { z } from "zod";
import { CLASES } from "../datos/gremio.js";

export const esquemaAventurero = z.object({
  nombre: z
    .string()
    .trim()
    .min(3, "Tu nombre necesita al menos 3 letras")
    .max(30, "Como mucho 30 letras"),
  clase: z.enum(CLASES, "Elige una clase"),
  nivel: z
    .number("Escribe tu nivel")
    .int("El nivel va sin decimales")
    .min(1, "Del 1 al 20")
    .max(20, "Del 1 al 20"),
});
