// App.jsx — 👀 Ya hecho: la página. Arriba, dos pestañas: la ficha de ejemplo (bloque A) y la forja (bloque B).
// Si una pieza aún está sin hacer, en su sitio sale «✍️ … sin hacer» (lo hace Pieza, un «error boundary»).
import { Component, useState } from "react";
import Ficha from "./componentes/Ficha.jsx";
import TarjetaClase from "./componentes/TarjetaClase.jsx";
import { CLASES } from "./datos/reglas.js";
import { BRENNA } from "./datos/ejemplo.js";
import Forja from "./forja/Forja.jsx";
import TiradaDado from "./forja/TiradaDado.jsx";

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

export default function App() {
  const [pestana, setPestana] = useState("ficha");
  return (
    <div className="app">
      <header className="cabecera">
        <h1>🛡️ Forja de héroes</h1>
        <nav>
          <button
            className={pestana === "ficha" ? "activa" : ""}
            onClick={() => setPestana("ficha")}
          >
            📜 Ficha de ejemplo (A)
          </button>
          <button
            className={pestana === "forja" ? "activa" : ""}
            onClick={() => setPestana("forja")}
          >
            🔨 La forja (B)
          </button>
        </nav>
      </header>
      <main>
        {pestana === "ficha" ? (
          <>
            <Pieza nombre="Ficha">
              <Ficha personaje={BRENNA} />
            </Pieza>
            <h2>Las clases</h2>
            <div className="clases">
              {CLASES.map((c) => (
                <Pieza key={c.id} nombre="TarjetaClase">
                  <TarjetaClase clase={c} elegida={c.id === BRENNA.claseId} />
                </Pieza>
              ))}
            </div>
          </>
        ) : (
          <>
            <TiradaDado />
            <Pieza nombre="Forja">
              <Forja />
            </Pieza>
          </>
        )}
      </main>
    </div>
  );
}
