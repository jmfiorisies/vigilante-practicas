// ✍️ B2 · ControlAtributo: subir y bajar un atributo. NO guarda nada: recibe el valor y AVISA al padre con
//    onSubir() y onBajar() (el estado vive arriba, en tu useCompraPuntos).
//    <div className="control-atributo">
//      <span className="nombre">Fuerza</span>
//      <button aria-label="Bajar Fuerza">−</button>   ← desactivado si puedeBajar es false; al pulsar, onBajar()
//      <output>8</output>
//      <button aria-label="Subir Fuerza">+</button>   ← desactivado si puedeSubir es false; al pulsar, onSubir()
//    </div>
export default function ControlAtributo({
  nombre,
  valor,
  puedeSubir,
  puedeBajar,
  onSubir,
  onBajar,
}) {
  throw new Error("Sin hacer");
}
