import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["eslint", "typescript", "oxc", "unicorn"],
  rules: {
    "unicorn/filename-case": ["error", { case: "kebabCase" }],
    "eslint/no-debugger": "error",
    "eslint/no-duplicate-imports": "error",
  },
  overrides: [
    {
      files: ["**/*.{test,spec}.{js,jsx,ts,tsx}"],
      plugins: ["eslint", "typescript", "oxc", "unicorn", "vitest"],
    },
  ],
});
