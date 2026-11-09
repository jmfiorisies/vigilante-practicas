// ayuda.jsx — Utilidades de las pruebas: una API de mentira (responde como json-server con api/db.original.json),
// contextos de prueba y una forma de probar hooks. Así las pruebas no necesitan la API de verdad. No se toca.
import { readFileSync } from "node:fs";
import { render } from "@testing-library/react";
import { useLocation } from "react-router";
import { vi } from "vitest";
import { GrupoContext } from "../src/estado/GrupoContext.jsx";
import { SesionContext } from "../src/estado/SesionContext.jsx";

export const DB = JSON.parse(readFileSync("api/db.original.json", "utf8"));

// El texto de un elemento, sin espacios de más
export const texto = (el) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();

// ¿Ha avisado React de que falta la key en una lista?
export const avisoDeKey = () => globalThis.AVISOS.some((a) => /unique "key"/.test(a));

// Congela un objeto (y lo de dentro): si alguien lo cambia, salta un error
export function congelar(o) {
  Object.values(o).forEach((v) => typeof v === "object" && v !== null && congelar(v));
  return Object.freeze(o);
}

const responder = (cuerpo, status = 200) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { "Content-Type": "application/json" } });

// Sustituye fetch. Entiende GET /api/misiones, GET /api/misiones/:id (404 si no existe) y POST /api/misiones (201 y
// la misión con un id nuevo: «m1», «m2»…). fallo = 500 en todo. Respeta el signal (abort).
export function simularApi({ fallo = false, retraso = 5 } = {}) {
  const creadas = [];
  const f = vi.fn(
    (url, opciones = {}) =>
      new Promise((ok, ko) => {
        const signal = opciones.signal;
        const abortar = () => ko(new DOMException("The operation was aborted.", "AbortError"));
        if (signal?.aborted) return abortar();
        signal?.addEventListener("abort", abortar);
        setTimeout(() => {
          if (signal?.aborted) return;
          if (fallo) return ok(responder({ error: "Fallo" }, 500));
          const u = new URL(String(url), "http://localhost");
          const metodo = (opciones.method ?? "GET").toUpperCase();
          const m = u.pathname.match(/^\/api\/misiones(?:\/([^/]+))?$/);
          if (!m) return ok(responder({ error: "Not Found" }, 404));
          const id = m[1];
          if (metodo === "POST" && !id) {
            let cuerpo;
            try {
              cuerpo = JSON.parse(opciones.body);
            } catch {
              return ok(responder({ error: "El cuerpo no es JSON" }, 400));
            }
            const nueva = { ...cuerpo, id: `m${creadas.length + 1}` };
            creadas.push(nueva);
            return ok(responder(nueva, 201));
          }
          const lista = [...DB.misiones, ...creadas];
          if (id) {
            const x = lista.find((l) => l.id === id);
            return ok(x ? responder(x) : responder({ error: "Not Found" }, 404));
          }
          ok(responder(lista));
        }, retraso);
      }),
  );
  f.creadas = creadas;
  globalThis.fetch = f;
  return f;
}

// Monta un componente mínimo que llama al hook y deja su resultado en r.actual
export function probarHook(usarHook, props) {
  const r = { actual: undefined };
  function Prueba(p) {
    r.actual = usarHook(p);
    return null;
  }
  const v = render(<Prueba {...props} />);
  r.cambiar = (nuevas) => v.rerender(<Prueba {...nuevas} />);
  r.desmontar = v.unmount;
  return r;
}

// Pinta la ruta en la que está el router (y su state), para que las pruebas vean adónde ha navegado
export function MostrarRuta() {
  const { pathname, state } = useLocation();
  return (
    <p data-testid="ruta" data-state={JSON.stringify(state ?? null)}>
      {pathname}
    </p>
  );
}

// Contextos de PRUEBA (no los tuyos): un aventurero dentro y un grupo vacío. Para probar los bloques A–C aunque el D
// esté sin hacer.
export const ANA = { nombre: "Ana", clase: "Mago", nivel: 3 };
export function conContextos(jsx, { aventurero = ANA, grupo = {} } = {}) {
  const sesion = { aventurero, entrar: vi.fn(), salir: vi.fn() };
  const g = {
    aceptadas: [],
    oro: 0,
    completadas: 0,
    lleno: false,
    aceptar: vi.fn(),
    abandonar: vi.fn(),
    completar: vi.fn(),
    ...grupo,
  };
  return (
    <SesionContext value={sesion}>
      <GrupoContext value={g}>{jsx}</GrupoContext>
    </SesionContext>
  );
}
