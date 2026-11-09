# DWEC · Práctica 2 · Tablero de tareas (kanban)

En tu ordenador no se instala nada: todo va en Docker.

```bash
cd p2-tablero
docker compose run --rm web npm install          # 1 vez, con internet
docker compose run --rm web npm test bloque-a    # los tests de un bloque (q para salir)
docker compose run --rm web npm test 2-recurrente   # solo un fichero
docker compose run --rm web npm test             # todos
docker compose run --rm web npm run lint         # ESLint
docker compose run --rm web npm run formato      # Prettier
docker compose up                                # la página en http://localhost:5173
```

El orden y lo que hay que hacer en cada bloque está en el enunciado. Resumen:

| Bloque | Ficheros | Rama |
|---|---|---|
| **A · UD4 · El modelo** | `src/modelo/`: lee `Tarea.js` (👀 resuelto) → `TareaRecurrente`, `Columna`, `Tablero`, `errores` | `feature/p2-a` |
| **B · UD5 · La página** | `src/ui/`: lee `crearTarjeta` y `leerFormulario` (👀 resueltos) → `pintarLista`, `mostrarErrores`, `delegar` y, en `app.js`, pintar, las acciones y el alta | `feature/p2-b` |
| **C · UD6 · Que recuerde** | lee `fechaATexto`, `aDatos` y `arranque.js` (👀 resueltos) → `desdeDatos`, `src/datos/red.js` y `persistencia.js`, `Tarea` (id), `Tablero` (JSON) | `feature/p2-c` |

Cada rama **sale de `develop` y vuelve a `develop`** al acabar el bloque. Al terminar la práctica, `develop` se
fusiona en `main` (la versión estable): lo que se corrige es `main`.

**Los avances puntúan:** lo que tengas subido a GitHub de cada bloque el **06/11** (A), el **20/11** (B) y el
**25/11** (C), a las 23:59, cuenta en la nota. Haz commit y `git push` cada vez que termines un apartado.
**No modifiques `tests/`**: el profesor corrige con sus propias copias.
