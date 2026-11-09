// eslint.config.js — las reglas de calidad (cuentan en la entrega). No hace falta tocarlo.
import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["dist/", "node_modules/", "docker/"] },
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser },
    },
    rules: {
      "no-var": "error",
      "prefer-const": "error",
      eqeqeq: ["error", "always"],
      "no-console": "warn",
      // ESLint solo no sabe que <Buscador /> USA Buscador: los nombres que empiezan por mayúscula (componentes) no cuentan
      // Aviso, no error: los huecos «Sin hacer» tienen parámetros que aún no usas. Al resolverlos desaparecen.
      "no-unused-vars": ["warn", { varsIgnorePattern: "^[A-Z]" }],
    },
  },
  { files: ["vite.config.js"], languageOptions: { globals: { ...globals.node } } },
];
