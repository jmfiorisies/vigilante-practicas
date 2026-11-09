// 👀 C0 · Layout: lo que se ve en TODAS las páginas (UD11, apartado 8). La cabecera con el menú y, debajo, <Outlet />:
//    ahí pinta React Router la página de la ruta. NavLink pone la clase "active" al enlace de la página en la que estás.
// ✍️ D4 · Añade <ContadorGrupo /> en la cabecera, justo antes de la sesión.
import { Link, NavLink, Outlet } from "react-router";
import { useSesion } from "../estado/SesionContext.jsx";

export default function Layout() {
  const { aventurero, salir } = useSesion();
  return (
    <div className="app">
      <header className="cabecera">
        <h1>🍺 Tablón del gremio</h1>
        <nav>
          <NavLink to="/misiones">Tablón</NavLink>
          <NavLink to="/publicar">Publicar</NavLink>
          <NavLink to="/grupo">Mi grupo</NavLink>
        </nav>
        <div className="sesion">
          {aventurero ? (
            <>
              <span>
                🧙 {aventurero.nombre} ({aventurero.clase}, nivel {aventurero.nivel})
              </span>
              <button onClick={salir}>Salir</button>
            </>
          ) : (
            <Link to="/entrar">Entrar</Link>
          )}
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
