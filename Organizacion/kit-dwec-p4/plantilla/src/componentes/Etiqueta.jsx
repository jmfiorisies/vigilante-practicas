// 👀 A0 · Ejemplo resuelto: una etiqueta pequeña («d10», «Elegida»…). Un componente es una FUNCIÓN que recibe
//    props (un objeto) y devuelve JSX. children es lo que va entre <Etiqueta> y </Etiqueta>.
//    <Etiqueta tipo="dado">d10</Etiqueta>  →  <span class="etiqueta etiqueta--dado">d10</span>
export default function Etiqueta({ tipo = "normal", children }) {
  return <span className={`etiqueta etiqueta--${tipo}`}>{children}</span>;
}
