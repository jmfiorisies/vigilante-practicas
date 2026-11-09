// ✍️ A3 · El aviso del rango (watch)
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import FormMision from "../../src/formularios/FormMision.jsx";
import { texto } from "../ayuda.jsx";

describe("A3 · Aviso del rango", () => {
  test("al elegir S (o A) sale el aviso con su rango, mientras escribes, sin enviar", async () => {
    const u = userEvent.setup();
    const { container } = render(<FormMision onPublicar={vi.fn()} />);
    expect(container.querySelector(".aviso-rango")).toBeNull();
    await u.selectOptions(screen.getByLabelText("Rango"), "S");
    expect(texto(container.querySelector("p.aviso-rango"))).toBe(
      "⚠️ Rango S: la recompensa mínima es de 500 de oro",
    );
    await u.selectOptions(screen.getByLabelText("Rango"), "A");
    expect(texto(container.querySelector("p.aviso-rango"))).toBe(
      "⚠️ Rango A: la recompensa mínima es de 500 de oro",
    );
  });

  test("con otro rango (o ninguno), no hay aviso", async () => {
    const u = userEvent.setup();
    const { container } = render(<FormMision onPublicar={vi.fn()} />);
    await u.selectOptions(screen.getByLabelText("Rango"), "S");
    await u.selectOptions(screen.getByLabelText("Rango"), "C");
    expect(container.querySelector(".aviso-rango")).toBeNull();
    await u.selectOptions(screen.getByLabelText("Rango"), "");
    expect(container.querySelector(".aviso-rango")).toBeNull();
  });
});
