# DWEC · Práctica 5 · Tablón del gremio

En tu ordenador no se instala nada: todo va en Docker.

```bash
cd p5-tablon
docker compose run --rm web npm install          # 1 vez, con internet (instala también la API)
docker compose run --rm web npm test bloque-a    # las pruebas de un bloque (q para salir)
docker compose run --rm web npm test 2-form-mision   # solo un fichero
docker compose run --rm web npm test             # todas
docker compose run --rm web npm run lint         # ESLint
docker compose run --rm web npm run formato      # Prettier
docker compose up                                # la página en http://localhost:5173 y la API en http://localhost:3000
docker compose run --rm web npm run api:limpia   # deja la API como al principio (borra las misiones que publiques)
```

Las pruebas no necesitan la API: usan una de mentira. La API de verdad (json-server) es para ver la página funcionando.

| Bloque | Ficheros | Rama |
|---|---|---|
| **A · UD9 · Publicar** | `src/formularios/`: lee `FormAventurero` (👀) → `esquemaMision.js`, `FormMision.jsx` | `feature/p5-a` |
| **B · UD10 · Buscar rápido** | `src/tablon/`: lee `medir.js` (👀) → `TarjetaMision.jsx`, `Buscador.jsx` | `feature/p5-b` |
| **C · UD11 · Páginas y API** | lee `pedirMisiones`, `Layout` y `NoEncontrada` (👀) → `src/api.js`, `src/hooks/useFetch.js`, `src/paginas/`, `src/App.jsx` | `feature/p5-c` |
| **D · UD12 · El grupo** | lee `SesionContext` (👀) → `src/estado/`, `PaginaEntrar`, `PaginaGrupo`, `App.jsx`, `Layout.jsx`, `main.jsx` | `feature/p5-d` |

Los datos del gremio (`src/datos/gremio.js`) y la API (`api/`) **no se tocan**: las pruebas cuentan con ellos.

Cada rama **sale de `develop` y vuelve a `develop`**. Al terminar, `develop` se fusiona en `main` (lo que se corrige).
**Los avances puntúan:** lo subido de cada bloque el **14/01** (A), el **21/01** (B), el **28/01** (C) y el **03/02** (D), a
las 23:59. Un commit por apartado (`A2: …`) y `git push`. **No modifiques `tests/`**.
