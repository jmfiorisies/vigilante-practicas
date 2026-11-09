// 👀 C0 · La página de la ruta «*»: cualquier dirección que no sea de las demás.
import { Link } from "react-router";

export default function NoEncontrada() {
  return (
    <section className="no-encontrada">
      <h2>404 · Esta página no está en el mapa</h2>
      <Link to="/misiones">Volver al tablón</Link>
    </section>
  );
}
