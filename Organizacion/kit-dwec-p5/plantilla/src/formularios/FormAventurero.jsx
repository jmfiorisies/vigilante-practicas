// 👀 A0 · Ejemplo resuelto: un formulario con React Hook Form + Zod (UD9, apartados 6 y 8). Tu FormMision es igual.
//    · register("campo") conecta cada input; valueAsNumber hace que el nivel llegue como número (o NaN si está vacío).
//    · handleSubmit(alEnviar) valida con Zod y SOLO llama a alEnviar si todo está bien, con los datos LIMPIOS.
//    · Cada error, debajo de su campo, con role="alert"; el campo, con aria-invalid y aria-describedby.
//    En el bloque D se usa para «entrar» en el gremio.
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CLASES } from "../datos/gremio.js";
import { esquemaAventurero } from "./esquemaAventurero.js";

export default function FormAventurero({ onEntrar, textoBoton = "Entrar en el gremio" }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(esquemaAventurero),
    defaultValues: { nombre: "", clase: "", nivel: 1 },
    mode: "onTouched",
  });
  const marcar = (campo) => ({
    "aria-invalid": errors[campo] ? true : undefined,
    "aria-describedby": errors[campo] ? `${campo}-error` : undefined,
  });

  return (
    <form className="formulario" noValidate onSubmit={handleSubmit(onEntrar)}>
      <label htmlFor="nombre">Nombre</label>
      <input id="nombre" {...register("nombre")} {...marcar("nombre")} />
      {errors.nombre && (
        <p className="error" id="nombre-error" role="alert">
          {errors.nombre.message}
        </p>
      )}

      <label htmlFor="clase">Clase</label>
      <select id="clase" {...register("clase")} {...marcar("clase")}>
        <option value="">— Elige —</option>
        {CLASES.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
      {errors.clase && (
        <p className="error" id="clase-error" role="alert">
          {errors.clase.message}
        </p>
      )}

      <label htmlFor="nivel">Nivel</label>
      <input
        id="nivel"
        type="number"
        {...register("nivel", { valueAsNumber: true })}
        {...marcar("nivel")}
      />
      {errors.nivel && (
        <p className="error" id="nivel-error" role="alert">
          {errors.nivel.message}
        </p>
      )}

      <button>{textoBoton}</button>
    </form>
  );
}
