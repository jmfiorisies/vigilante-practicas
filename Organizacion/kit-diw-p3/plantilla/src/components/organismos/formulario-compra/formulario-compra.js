// formulario-compra.js — 👀 ya está hecho. El organismo Formulario de compra.
// Las REGLAS van en el HTML (required, type="email", pattern): el navegador ya sabe comprobarlas.
// «novalidate» le dice que NO enseñe sus globos: los mensajes los ponemos nosotros (✍️ B3).
function campo({ id, etiqueta, ayuda = "", atributos }) {
  const describe = ayuda ? `${id}-ayuda ${id}-error` : `${id}-error`;
  return `<div class="campo">
    <label class="campo__etiqueta" for="${id}">${etiqueta}</label>
    ${ayuda ? `<p class="campo__ayuda" id="${id}-ayuda">${ayuda}</p>` : ""}
    <input class="campo__control" id="${id}" ${atributos} aria-describedby="${describe}">
    <p class="campo__error" id="${id}-error" hidden></p>
  </div>`;
}

export function FormularioCompra({ pelicula = "La luz de la Caleta", sesion = "Viernes 21:30 · Patio" } = {}) {
  return `<form class="compra-form" novalidate data-pelicula="${pelicula}" data-sesion="${sesion}">
  <h2 class="compra-form__titulo">Tus datos</h2>
  ${campo({ id: "compra-nombre", etiqueta: "Tu nombre", atributos: 'name="nombre" required autocomplete="name"' })}
  ${campo({ id: "compra-correo", etiqueta: "Tu correo (te enviamos las entradas)", atributos: 'name="correo" type="email" required autocomplete="email"' })}
  ${campo({
    id: "compra-telefono",
    etiqueta: "Teléfono (si quieres un aviso si se suspende por lluvia)",
    ayuda: "9 cifras, sin espacios",
    atributos: 'name="telefono" type="tel" pattern="[6789][0-9]{8}" autocomplete="tel"',
  })}
  <div class="campo campo--casilla">
    <input class="campo__control" id="compra-acepto" name="acepto" type="checkbox" required aria-describedby="compra-acepto-error">
    <label class="campo__etiqueta" for="compra-acepto">He leído que no se devuelven las entradas (salvo si se suspende)</label>
    <p class="campo__error" id="compra-acepto-error" hidden></p>
  </div>
  <button type="submit" class="boton boton--primario boton--grande">Pagar las entradas</button>
  <p class="compra-form__ok" role="status" hidden></p>
</form>`;
}
