// 👀 D0 · SesionContext (no cuenta para nota)
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { SesionProvider, useSesion } from "../../src/estado/SesionContext.jsx";

function Prueba() {
  const { aventurero, entrar, salir } = useSesion();
  return (
    <>
      <p>{aventurero ? aventurero.nombre : "nadie"}</p>
      <button onClick={() => entrar({ nombre: "Ana", clase: "Mago", nivel: 3 })}>entrar</button>
      <button onClick={salir}>salir</button>
    </>
  );
}

describe("👀 D0 · La sesión", () => {
  test("entrar y salir cambian el aventurero para todos los de dentro", async () => {
    render(
      <SesionProvider>
        <Prueba />
      </SesionProvider>,
    );
    expect(screen.getByText("nadie")).toBeTruthy();
    await userEvent.click(screen.getByText("entrar"));
    expect(screen.getByText("Ana")).toBeTruthy();
    await userEvent.click(screen.getByText("salir"));
    expect(screen.getByText("nadie")).toBeTruthy();
  });
});
