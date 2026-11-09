// ✍️ D2 · GrupoProvider y useGrupo
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { GrupoProvider, useGrupo } from "../../src/estado/GrupoContext.jsx";
import { DB, texto } from "../ayuda.jsx";

const [M1, M2, M3] = DB.misiones;

function Prueba() {
  const g = useGrupo();
  return (
    <>
      <p data-testid="estado">
        {g.aceptadas.map((m) => m.id).join(",")}|{g.oro}|{g.completadas}|{String(g.lleno)}
      </p>
      {[M1, M2, M3].map((m) => (
        <button key={m.id} onClick={() => g.aceptar(m)}>
          aceptar {m.id}
        </button>
      ))}
      <button onClick={() => g.completar(M1.id)}>completar</button>
      <button onClick={() => g.abandonar(M2.id)}>abandonar</button>
    </>
  );
}
const estado = () => texto(screen.getByTestId("estado"));

describe("D2 · El grupo en un Context", () => {
  test("useGrupo fuera de un GrupoProvider lanza el error del enunciado", () => {
    expect(() => render(<Prueba />)).toThrow("useGrupo tiene que usarse dentro de <GrupoProvider>");
  });

  test("aceptar, completar y abandonar cambian lo que ven los de dentro; lleno con 3", async () => {
    const u = userEvent.setup();
    render(
      <GrupoProvider>
        <Prueba />
      </GrupoProvider>,
    );
    expect(estado()).toBe("|0|0|false");
    for (const m of [M1, M2, M3]) await u.click(screen.getByText(`aceptar ${m.id}`));
    expect(estado()).toBe(`${M1.id},${M2.id},${M3.id}|0|0|true`);
    await u.click(screen.getByText("completar"));
    await u.click(screen.getByText("abandonar"));
    expect(estado()).toBe(`${M3.id}|${M1.recompensa}|1|false`);
  });

  test("la prop inicial: empieza con ese grupo", () => {
    render(
      <GrupoProvider inicial={{ aceptadas: [M1], oro: 50, completadas: 2 }}>
        <Prueba />
      </GrupoProvider>,
    );
    expect(estado()).toBe(`${M1.id}|50|2|false`);
  });
});
