# DWEC · Práctica 4 · Forja de héroes

En tu ordenador no se instala nada: todo va en Docker.

```bash
cd p4-forja
docker compose run --rm web npm install          # 1 vez, con internet
docker compose run --rm web npm test bloque-a    # las pruebas de un bloque (q para salir)
docker compose run --rm web npm test 5-ficha     # solo un fichero
docker compose run --rm web npm test             # todas
docker compose run --rm web npm run lint         # ESLint
docker compose run --rm web npm run formato      # Prettier
docker compose up                                # la página en http://localhost:5173
```

El orden y lo que hay que hacer en cada bloque está en el enunciado. Resumen:

| Bloque | Ficheros | Rama |
|---|---|---|
| **A · UD7 · La ficha** | `src/componentes/`: lee `Etiqueta.jsx` (👀 resuelto) → `Atributo`, `BloqueAtributos`, `ListaRasgos`, `TarjetaClase`, `Ficha` | `feature/p4-a` |
| **B · UD8 · La forja** | lee `TiradaDado.jsx` y `modificador`/`tirar` (👀 resueltos) → `src/logica/reglas.js`, `src/forja/`: `ControlAtributo`, `useCompraPuntos`, `ElegirClase`, `Forja` | `feature/p4-b` |

Los datos (razas, clases, costes) están en `src/datos/`: **no los cambies**, las pruebas cuentan con ellos.

Cada rama **sale de `develop` y vuelve a `develop`** al acabar el bloque. Al terminar la práctica, `develop` se
fusiona en `main` (la versión estable): lo que se corrige es `main`.

**Los avances puntúan:** lo que tengas subido a GitHub de cada bloque el **04/12** (A) y el **15/12** (B), a las
23:59, cuenta en la nota. Haz un commit por apartado (`A2: …`) y `git push`.
**No modifiques `tests/`**: el profesor corrige con sus propias copias.
