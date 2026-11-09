// @vitest-environment happy-dom
import { describe, expect, test } from "vitest";
import { iniciar } from "../../src/arranque.js";
import { CLAVE } from "../../src/datos/persistencia.js";
import { cargarPagina } from "../pagina.js";
import { almacenFalso, fetchFalso, fetchSinRed } from "../simulados.js";

const INICIALES = [{ titulo: "Inicial 1", prioridad: "alta" }, { titulo: "Inicial 2" }];
const $ = (s) => document.querySelector(s);
const titulos = () => [...document.querySelectorAll(".tarjeta h3")].map((h) => h.textContent);

describe("👀 C7 · La página arranca con datos y los guarda (resuelto: sale en verde cuando funcionan tus C1–C6)", () => {
  test("mientras carga se ve «Cargando…»; al acabar se esconde y se pintan las tareas", async () => {
    const raiz = cargarPagina();
    const promesa = iniciar(raiz, {
      storage: almacenFalso(),
      fetchFn: fetchFalso({ cuerpo: INICIALES }),
    });
    expect($("#estado").hidden).toBe(false);
    expect($("#estado").textContent).toMatch(/cargando/i);
    await promesa;
    expect($("#estado").hidden).toBe(true);
    expect(titulos()).toEqual(["Inicial 1", "Inicial 2"]);
  });

  test("si falla la carga: el estado enseña el error y el tablero sale vacío (pero funciona)", async () => {
    const raiz = cargarPagina();
    await iniciar(raiz, { storage: almacenFalso(), fetchFn: fetchSinRed });
    expect($("#estado").hidden).toBe(false);
    expect($("#estado").textContent).not.toMatch(/cargando/i);
    expect($('[data-columna="Por hacer"] .lista').textContent).toBe("Sin tareas");
  });

  test("tras cada cambio en la página, el tablero se guarda en storage", async () => {
    const s = almacenFalso();
    const raiz = cargarPagina();
    await iniciar(raiz, { storage: s, fetchFn: fetchFalso({ cuerpo: INICIALES }) });
    document.querySelector('.tarjeta button[data-accion="empezar"]').click();
    const guardado = JSON.parse(s.getItem(CLAVE));
    expect(guardado.columnas["En curso"].map((t) => t.titulo)).toEqual(["Inicial 1"]);
  });

  test("al «recargar» la página con el mismo storage, se recupera lo que había (sin red)", async () => {
    const s = almacenFalso();
    await iniciar(cargarPagina(), { storage: s, fetchFn: fetchFalso({ cuerpo: INICIALES }) });
    document.querySelector('.tarjeta button[data-accion="empezar"]').click();
    const f = fetchFalso({ cuerpo: [] });
    const { origen } = await iniciar(cargarPagina(), { storage: s, fetchFn: f });
    expect(origen).toBe("guardado");
    expect(f.pedidas).toEqual([]);
    expect(
      [...$('[data-columna="En curso"] .lista').querySelectorAll("h3")].map((h) => h.textContent),
    ).toEqual(["Inicial 1"]);
  });
});
