import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["eslint", "typescript", "oxc", "unicorn", "import"],
  rules: {
    // Let the TypeScript rule own all require forms without duplicate reports.
    "import/no-commonjs": ["error", { allowRequire: true }],
    "import/no-relative-parent-imports": "error",
    "typescript/no-require-imports": "error",
    "unicorn/filename-case": ["error", { case: "kebabCase" }],
    "eslint/no-debugger": "error",
    "eslint/no-duplicate-imports": "error",
  },
  overrides: [
    {
      files: ["**/*.{test,spec}.{js,jsx,ts,tsx}"],
      plugins: ["eslint", "typescript", "oxc", "unicorn", "import", "vitest"],
    },
  ],
});
