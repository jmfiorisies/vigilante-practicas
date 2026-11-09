// ✍️ A1 · esquemaMision: las reglas de una misión, con Zod (UD9, apartado 5). Como el de FormAventurero.
//    titulo       texto SIN espacios a los lados, de 5 a 60 letras  «El título necesita al menos 5 letras» · «Como mucho 60 letras»
//    rango        uno de RANGOS                                    «Elige un rango»
//    region       una de REGIONES                                  «Elige una región»
//    recompensa   número entero, 10 o más                          «Escribe la recompensa» · «La recompensa va sin decimales» · «Como mínimo 10 de oro»
//    plazas       número entero, de 1 a 6                          «Escribe las plazas» · «Las plazas van sin decimales» · «De 1 a 6 plazas»
//    descripcion  texto sin espacios a los lados, hasta 200 letras  «Como mucho 200 letras»
//    Y una regla ENTRE CAMPOS (refine): si el rango es A o S, la recompensa tiene que ser de RECOMPENSA_ALTA (500) o
//    más: «Una misión de rango A o S paga al menos 500 de oro», en el campo recompensa.
import { z } from "zod";
import { RANGOS, RECOMPENSA_ALTA, REGIONES } from "../datos/gremio.js";

export const esquemaMision = z.object({}); // ✍️ cámbialo por el de verdad (ahora mismo lo acepta TODO)
