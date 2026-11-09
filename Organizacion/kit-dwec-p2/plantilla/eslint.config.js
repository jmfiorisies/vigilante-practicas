// eslint.config.js — las reglas de la P1, ahora sí cuentan en la entrega
import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["dist/", "node_modules/", "docker/"] },
  js.configs.recommended,
  {
    languageOptions: { ecmaVersion: 2024, sourceType: "module", globals: { ...globals.browser } },
    rules: {
      "no-var": "error",
      "prefer-const": "error",
      eqeqeq: ["error", "always"],
      "no-console": "warn",
      // Aviso, no error: los huecos «Sin hacer» tienen parámetros que aún no usas. Al resolverlos desaparecen.
      "no-unused-vars": "warn",
    },
  },
];
