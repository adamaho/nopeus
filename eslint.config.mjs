import parser from "@typescript-eslint/parser";

import plugin from "./packages/nopeus-oxlint-plugin/src/index.ts";

export default [
  { ignores: ["packages/nopeus-oxlint-plugin/test/fixtures/**"] },
  {
    files: ["**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}"],
    languageOptions: {
      parser,
      parserOptions: { ecmaVersion: "latest", sourceType: "module" },
    },
    plugins: { nopeus: plugin },
    rules: {
      "nopeus/no-export-assignment": "error",
      "nopeus/no-cross-package-internals": "error",
      "nopeus/no-test-imports": "error",
      "nopeus/require-test-location": "error",
    },
  },
];
