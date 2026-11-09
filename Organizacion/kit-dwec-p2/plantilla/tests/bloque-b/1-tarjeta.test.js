// @vitest-environment happy-dom
import { beforeEach, describe, expect, test } from "vitest";
import { Tarea } from "../../src/modelo/Tarea.js";
import { crearTarjeta, pintarLista } from "../../src/ui/tarjeta.js";

const HOY = new Date(2026, 10, 6);
const tareas = () => [
  new Tarea("Uno", "alta", "2026-11-01"),
  new Tarea("Dos"),
  new Tarea("Tres", "baja"),
];

describe("👀 B0 · crearTarjeta (ejemplo resuelto)", () => {
  test("un <article class='tarjeta'> con data-id, su prioridad y su título", () => {
    const t = new Tarea("Probar", "alta");
    const tarjeta = crearTarjeta(t, HOY);
    expect(tarjeta.tagName).toBe("ARTICLE");
    expect(tarjeta.classList.contains("tarjeta")).toBe(true);
    expect(tarjeta.classList.contains("tarjeta--alta")).toBe(true);
    expect(tarjeta.dataset.id).toBe(String(t.id));
    expect(tarjeta.querySelector("h3").textContent).toBe("Probar");
  });

  test("marca las vencidas y enseña el límite", () => {
    const tarjeta = crearTarjeta(tareas()[0], HOY);
    expect(tarjeta.classList.contains("tarjeta--vencida")).toBe(true);
    expect(tarjeta.querySelector(".tarjeta__limite").textContent).toBe("Límite: 01/11/2026");
  });

  test("el título se escribe como texto: el HTML del usuario no se ejecuta", () => {
    const t = new Tarea('<img src="x" onerror="alert(1)">');
    const tarjeta = crearTarjeta(t, HOY);
    expect(tarjeta.querySelector("img")).toBeNull();
    expect(tarjeta.querySelector("h3").textContent).toContain("<img");
  });
});

describe("✍️ B1 · pintarLista", () => {
  let lista;
  beforeEach(() => {
    document.body.innerHTML = '<div class="lista"></div>';
    lista = document.querySelector(".lista");
  });

  test("pone una tarjeta por tarea, en el mismo orden", () => {
    pintarLista(lista, tareas(), HOY);
    const titulos = [...lista.querySelectorAll(".tarjeta h3")].map((h) => h.textContent);
    expect(titulos).toEqual(["Uno", "Dos", "Tres"]);
  });

  test("pintar dos veces NO duplica: primero vacía", () => {
    pintarLista(lista, tareas(), HOY);
    pintarLista(lista, tareas().slice(0, 1), HOY);
    expect(lista.querySelectorAll(".tarjeta")).toHaveLength(1);
  });

  test("sin tareas: un único <p class='vacia'> con «Sin tareas»", () => {
    pintarLista(lista, tareas(), HOY);
    pintarLista(lista, [], HOY);
    expect(lista.children).toHaveLength(1);
    expect(lista.firstElementChild.className).toBe("vacia");
    expect(lista.textContent).toBe("Sin tareas");
  });

  test("usa crearTarjeta: las tarjetas llevan data-id", () => {
    const ts = tareas();
    pintarLista(lista, ts, HOY);
    expect([...lista.children].map((c) => Number(c.dataset.id))).toEqual(ts.map((t) => t.id));
  });
});
