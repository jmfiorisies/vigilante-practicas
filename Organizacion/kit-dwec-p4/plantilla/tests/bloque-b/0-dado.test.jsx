import { within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import TiradaDado from "../../src/forja/TiradaDado.jsx";
import { montar, texto } from "../ayuda.jsx";

describe("👀 B0 · TiradaDado (ejemplo resuelto)", () => {
  test("empieza sin tirada y, al pulsar, guarda y pinta la nueva (con un 20, «¡Crítico!»)", async () => {
    const { c } = montar(<TiradaDado />);
    expect(texto(c.querySelector("output"))).toBe("—");
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    await userEvent.click(within(c).getByRole("button", { name: "🎲 Tirar d20" }));
    expect(texto(c.querySelector("output"))).toBe("11");
    Math.random.mockReturnValue(0.99);
    await userEvent.click(within(c).getByRole("button", { name: "🎲 Tirar d20" }));
    expect(texto(c.querySelector(".critico"))).toBe("¡Crítico!");
  });
});
