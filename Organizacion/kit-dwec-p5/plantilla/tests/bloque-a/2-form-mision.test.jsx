// ✍️ A2 · FormMision (React Hook Form + Zod)
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import FormMision from "../../src/formularios/FormMision.jsx";
import { texto } from "../ayuda.jsx";

async function rellenar(
  u,
  {
    titulo = "Cazar un grifo",
    rango = "C",
    region = "Costa de Sal",
    recompensa = "120",
    plazas = "3",
    descripcion = "",
  } = {},
) {
  await u.type(screen.getByLabelText("Título"), titulo);
  await u.selectOptions(screen.getByLabelText("Rango"), rango);
  await u.selectOptions(screen.getByLabelText("Región"), region);
  await u.clear(screen.getByLabelText("Recompensa (oro)"));
  await u.type(screen.getByLabelText("Recompensa (oro)"), recompensa);
  await u.clear(screen.getByLabelText("Plazas"));
  await u.type(screen.getByLabelText("Plazas"), plazas);
  if (descripcion) await u.type(screen.getByLabelText("Descripción"), descripcion);
}

describe("A2 · FormMision", () => {
  test("cada campo con su etiqueta; los select empiezan en «— Elige —»; recompensa 10 y plazas 4", () => {
    render(<FormMision onPublicar={vi.fn()} />);
    expect(screen.getByLabelText("Título").value).toBe("");
    expect(screen.getByLabelText("Rango").options).toHaveLength(7);
    expect(screen.getByLabelText("Rango").options[0].textContent).toBe("— Elige —");
    expect(screen.getByLabelText("Región").options).toHaveLength(6);
    expect(screen.getByLabelText("Recompensa (oro)").value).toBe("10");
    expect(screen.getByLabelText("Plazas").value).toBe("4");
    expect(screen.getByLabelText("Descripción").tagName).toBe("TEXTAREA");
    expect(screen.getByRole("button", { name: "Publicar misión" })).toBeTruthy();
  });

  test("enviar sin rellenar: no publica y cada error sale bajo su campo, accesible", async () => {
    const u = userEvent.setup();
    const onPublicar = vi.fn();
    render(<FormMision onPublicar={onPublicar} />);
    await u.click(screen.getByRole("button", { name: "Publicar misión" }));
    const avisos = (await screen.findAllByRole("alert")).map(texto);
    expect(avisos).toEqual([
      "El título necesita al menos 5 letras",
      "Elige un rango",
      "Elige una región",
    ]);
    expect(onPublicar).not.toHaveBeenCalled();
    const titulo = screen.getByLabelText("Título");
    expect(titulo.getAttribute("aria-invalid")).toBe("true");
    expect(titulo.getAttribute("aria-describedby")).toBe("titulo-error");
    expect(texto(document.getElementById("titulo-error"))).toBe(
      "El título necesita al menos 5 letras",
    );
  });

  test("con todo bien: publica los datos LIMPIOS (números como números) y el formulario se vacía", async () => {
    const u = userEvent.setup();
    const onPublicar = vi.fn();
    render(<FormMision onPublicar={onPublicar} />);
    await rellenar(u, { titulo: "  Cazar un grifo  ", descripcion: "Traed red" });
    await u.click(screen.getByRole("button", { name: "Publicar misión" }));
    await waitFor(() => expect(onPublicar).toHaveBeenCalledTimes(1));
    expect(onPublicar.mock.calls[0][0]).toEqual({
      titulo: "Cazar un grifo",
      rango: "C",
      region: "Costa de Sal",
      recompensa: 120,
      plazas: 3,
      descripcion: "Traed red",
    });
    await waitFor(() => expect(screen.getByLabelText("Título").value).toBe(""));
    expect(screen.getByLabelText("Rango").value).toBe("");
    expect(screen.getByLabelText("Plazas").value).toBe("4");
  });

  test("rango S con 100 de oro: no publica y el error de la regla sale en la recompensa", async () => {
    const u = userEvent.setup();
    const onPublicar = vi.fn();
    render(<FormMision onPublicar={onPublicar} />);
    await rellenar(u, { rango: "S", recompensa: "100" });
    await u.click(screen.getByRole("button", { name: "Publicar misión" }));
    await waitFor(() =>
      expect(texto(document.getElementById("recompensa-error"))).toBe(
        "Una misión de rango A o S paga al menos 500 de oro",
      ),
    );
    expect(onPublicar).not.toHaveBeenCalled();
  });

  test("mientras se publica, el botón dice «Publicando…» y está desactivado (await onPublicar)", async () => {
    const u = userEvent.setup();
    let terminar;
    const onPublicar = vi.fn(() => new Promise((ok) => (terminar = ok)));
    render(<FormMision onPublicar={onPublicar} />);
    await rellenar(u);
    await u.click(screen.getByRole("button", { name: "Publicar misión" }));
    const boton = await screen.findByRole("button", { name: "Publicando…" });
    expect(boton.disabled).toBe(true);
    terminar();
    expect((await screen.findByRole("button", { name: "Publicar misión" })).disabled).toBe(false);
  });
});
