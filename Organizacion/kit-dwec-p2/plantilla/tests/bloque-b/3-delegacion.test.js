// @vitest-environment happy-dom
import { beforeEach, describe, expect, test } from "vitest";
import { delegar } from "../../src/ui/delegacion.js";

let lista, pulsados;
beforeEach(() => {
  document.body.innerHTML = `
    <div id="fuera"><button data-accion="x">fuera</button></div>
    <div id="lista">
      <button data-accion="borrar"><span>🗑</span> Borrar</button>
      <p>texto</p>
    </div>`;
  lista = document.querySelector("#lista");
  pulsados = [];
});
const anotar = (boton, evento) => pulsados.push([boton.dataset.accion, evento.type]);

describe("✍️ B3 · delegar", () => {
  test("un clic en el botón llama al manejador con el botón y el evento", () => {
    delegar(lista, "click", "button[data-accion]", anotar);
    lista.querySelector("button").click();
    expect(pulsados).toEqual([["borrar", "click"]]);
  });

  test("también si se pulsa un HIJO del botón (closest)", () => {
    delegar(lista, "click", "button[data-accion]", anotar);
    lista.querySelector("span").click();
    expect(pulsados).toEqual([["borrar", "click"]]);
  });

  test("lo que no encaja con el selector se ignora", () => {
    delegar(lista, "click", "button[data-accion]", anotar);
    lista.querySelector("p").click();
    document.querySelector("#fuera button").click();
    expect(pulsados).toEqual([]);
  });

  test("funciona con botones añadidos DESPUÉS (la ventaja de delegar)", () => {
    delegar(lista, "click", "button[data-accion]", anotar);
    const nuevo = document.createElement("button");
    nuevo.dataset.accion = "nuevo";
    lista.append(nuevo);
    nuevo.click();
    expect(pulsados).toEqual([["nuevo", "click"]]);
  });

  test("un solo listener: devuelve una función que lo quita", () => {
    const quitar = delegar(lista, "click", "button[data-accion]", anotar);
    lista.querySelector("button").click();
    quitar();
    lista.querySelector("button").click();
    expect(pulsados).toHaveLength(1);
  });
});
