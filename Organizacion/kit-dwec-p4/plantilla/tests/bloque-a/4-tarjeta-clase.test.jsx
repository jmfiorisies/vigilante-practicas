import { describe, expect, test } from "vitest";
import TarjetaClase from "../../src/componentes/TarjetaClase.jsx";
import { buscar, CLASES } from "../../src/datos/reglas.js";
import { montar, texto } from "../ayuda.jsx";

const guerrero = buscar(CLASES, "guerrero");
const mago = buscar(CLASES, "mago");

describe("A4 · TarjetaClase", () => {
  test("article.tarjeta-clase con «icono nombre» en el <h3> y la etiqueta del dado (con tu Etiqueta)", () => {
    const { c } = montar(<TarjetaClase clase={mago} />);
    const art = c.querySelector("article");
    expect(art.className).toBe("tarjeta-clase");
    expect(texto(art.querySelector("h3"))).toBe("🔮 Mago");
    const dado = art.querySelector(".etiqueta--dado");
    expect(dado?.className).toBe("etiqueta etiqueta--dado");
    expect(texto(dado)).toBe("d6");
  });

  test("elegida: clase «tarjeta-clase elegida» y la etiqueta «Elegida»; si no, ninguna de las dos", () => {
    const si = montar(<TarjetaClase clase={guerrero} elegida />).c;
    expect(si.querySelector("article").className).toBe("tarjeta-clase elegida");
    expect(texto(si.querySelector(".etiqueta--ok"))).toBe("Elegida");
    const no = montar(<TarjetaClase clase={guerrero} elegida={false} />).c;
    expect(no.querySelector("article").className).toBe("tarjeta-clase");
    expect(no.querySelector(".etiqueta--ok")).toBeNull();
    expect(texto(no)).not.toMatch(/false|Elegida/);
  });

  test("children: lo que va dentro de <TarjetaClase> sale DENTRO del article", () => {
    const { c } = montar(
      <TarjetaClase clase={guerrero}>
        <button>Elegir</button>
      </TarjetaClase>,
    );
    expect(c.querySelector("article > button")?.textContent).toBe("Elegir");
  });
});
