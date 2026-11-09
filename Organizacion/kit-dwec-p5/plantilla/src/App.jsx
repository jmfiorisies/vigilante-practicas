// App.jsx — 👀 PROVISIONAL: un escaparate para ver lo que vas haciendo en los bloques A y B, antes de tener rutas.
// Si una pieza aún está sin hacer, en su sitio sale «✍️ … sin hacer» (lo hace Pieza, un «error boundary»).
//
// ✍️ C4 · Cuando llegues al bloque C, BORRA este escaparate y pon aquí las rutas (UD11, apartado 8). Todas dentro del
//    Layout (👀), que pinta la página en su <Outlet />:
//      /              → a /misiones (<Navigate replace />)
//      /misiones      → PaginaTablon
//      /misiones/:id  → PaginaMision
//      /publicar      → PaginaPublicar
//      cualquier otra → NoEncontrada
// ✍️ D3 · Y del bloque D: /entrar → PaginaEntrar; /grupo → PaginaGrupo; /publicar y /grupo, dentro de <RutaPrivada>.
import { Component } from "react";
import { misionesDePrueba } from "./datos/gremio.js";
import FormAventurero from "./formularios/FormAventurero.jsx";
import FormMision from "./formularios/FormMision.jsx";
import Buscador from "./tablon/Buscador.jsx";

class Pieza extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (error.message === "Sin hacer")
      return <p className="sin-hacer">✍️ {this.props.nombre}: sin hacer</p>;
    return (
      <pre className="revienta">
        💥 {this.props.nombre}: {error.message}
      </pre>
    );
  }
}

const MUCHAS = misionesDePrueba(600); // cientos de misiones, para medir el bloque B
const mostrar = (datos) => alert(JSON.stringify(datos, null, 2));

export default function App() {
  return (
    <div className="app escaparate">
      <header className="cabecera">
        <h1>🍺 Tablón del gremio · escaparate provisional</h1>
      </header>
      <main>
        <section>
          <h2>A · El aventurero (👀) y publicar una misión (✍️)</h2>
          <FormAventurero onEntrar={mostrar} />
          <Pieza nombre="FormMision">
            <FormMision onPublicar={mostrar} />
          </Pieza>
        </section>
        <section>
          <h2>B · El buscador, con {MUCHAS.length} misiones</h2>
          <Pieza nombre="Buscador">
            <Buscador misiones={MUCHAS} />
          </Pieza>
        </section>
      </main>
    </div>
  );
}
