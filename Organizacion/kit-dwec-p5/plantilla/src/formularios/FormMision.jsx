// ✍️ A2 · FormMision({ onPublicar }): publicar una misión en el tablón, con React Hook Form y TU esquemaMision.
//    Mira FormAventurero (👀): es lo mismo con más campos. Cada campo con su <label htmlFor> (las pruebas los buscan
//    por el texto de la etiqueta):
//      «Título» (input) · «Rango» (select: «— Elige —» y los RANGOS) · «Región» (select: «— Elige —» y las REGIONES)
//      «Recompensa (oro)» (number) · «Plazas» (number) · «Descripción» (textarea)
//    · Los números, con valueAsNumber. Valores iniciales: todo vacío ("") salvo recompensa 10 y plazas 4.
//    · mode: "onTouched". Cada error como en FormAventurero (p.error con id «campo-error», role="alert", aria-invalid…).
//    · Al enviar con todo bien: await onPublicar(datos) y, después, el formulario vuelve a estar vacío (reset).
//    · Mientras se publica (isSubmitting), el botón está desactivado y dice «Publicando…»; si no, «Publicar misión».
// ✍️ A3 · Debajo del rango, SOLO si el rango elegido es A o S (watch), un aviso:
//      <p className="aviso-rango">⚠️ Rango S: la recompensa mínima es de 500 de oro</p>
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { RANGOS, RECOMPENSA_ALTA, REGIONES } from "../datos/gremio.js";
import { esquemaMision } from "./esquemaMision.js";

export default function FormMision({ onPublicar }) {
  throw new Error("Sin hacer");
}
