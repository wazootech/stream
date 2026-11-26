import eslint from "@eslint/js"
import globals from "globals"
import tseslint from "typescript-eslint"

export default tseslint.config(
  {
    ignores: ["dist/**", "node_modules/**", "overlays/state.js"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // Overlay pages are classic browser scripts, not modules.
    files: ["overlays/**/*.js"],
    languageOptions: { sourceType: "script", globals: globals.browser },
  },
  {
    // The dashboard page is served over http, so it can use ES modules.
    files: ["dashboard/**/*.js"],
    languageOptions: { globals: globals.browser },
  },
)
