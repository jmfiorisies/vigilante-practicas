// 👀 A0 · El ejemplo resuelto: el esquema y el formulario del aventurero (no cuentan para nota).
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { esquemaAventurero } from "../../src/formularios/esquemaAventurero.js";
import FormAventurero from "../../src/formularios/FormAventurero.jsx";

describe("👀 A0 · El aventurero", () => {
  test("el esquema limpia el nombre y avisa de cada campo mal", () => {
    expect(esquemaAventurero.safeParse({ nombre: "  Ana ", clase: "Mago", nivel: 3 }).data).toEqual(
      {
        nombre: "Ana",
        clase: "Mago",
        nivel: 3,
      },
    );
    const r = esquemaAventurero.safeParse({ nombre: "A", clase: "", nivel: NaN });
    expect(r.error.issues.map((i) => i.path[0])).toEqual(["nombre", "clase", "nivel"]);
  });

  test("el formulario solo envía con todo bien, y los datos llegan limpios", async () => {
    const u = userEvent.setup();
    const onEntrar = vi.fn();
    render(<FormAventurero onEntrar={onEntrar} />);
    await u.click(screen.getByRole("button", { name: "Entrar en el gremio" }));
    expect(await screen.findAllByRole("alert")).toHaveLength(2);
    expect(onEntrar).not.toHaveBeenCalled();
    await u.type(screen.getByLabelText("Nombre"), " Ana ");
    await u.selectOptions(screen.getByLabelText("Clase"), "Mago");
    await u.clear(screen.getByLabelText("Nivel"));
    await u.type(screen.getByLabelText("Nivel"), "3");
    await u.click(screen.getByRole("button", { name: "Entrar en el gremio" }));
    await waitFor(() => expect(onEntrar).toHaveBeenCalled());
    expect(onEntrar.mock.calls[0][0]).toEqual({ nombre: "Ana", clase: "Mago", nivel: 3 });
  });
});
