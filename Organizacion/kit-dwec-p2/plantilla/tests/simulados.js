// simulados.js — un localStorage y un fetch de mentira para los tests (no es un test).

/** Un almacén con la misma interfaz que localStorage (getItem, setItem, removeItem) */
export function almacenFalso(inicial = {}) {
  const datos = new Map(Object.entries(inicial));
  return {
    getItem: (k) => (datos.has(k) ? datos.get(k) : null),
    setItem: (k, v) => datos.set(k, String(v)),
    removeItem: (k) => datos.delete(k),
    get length() {
      return datos.size;
    },
  };
}

/** Un fetch que responde siempre lo mismo. Guarda las URL pedidas en .pedidas */
export function fetchFalso({ estado = 200, tipo = "application/json", cuerpo = [] } = {}) {
  const fn = async (url) => {
    fn.pedidas.push(url);
    return new Response(typeof cuerpo === "string" ? cuerpo : JSON.stringify(cuerpo), {
      status: estado,
      headers: { "content-type": tipo },
    });
  };
  fn.pedidas = [];
  return fn;
}

/** Un fetch que falla como cuando no hay red */
export const fetchSinRed = async () => {
  throw new TypeError("Failed to fetch");
};
