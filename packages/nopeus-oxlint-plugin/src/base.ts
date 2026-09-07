import { defineConfig } from "oxlint";

/** General Nopeus syntax rules for TypeScript projects. */
export default defineConfig({
  jsPlugins: [{ name: "nopeus", specifier: "@adamaho/nopeus-oxlint-plugin" }],
  rules: {
    "nopeus/no-export-assignment": "error",
    "nopeus/no-cross-package-internals": "error",
    "nopeus/no-test-imports": "error",
    "nopeus/require-test-location": "error",
    "nopeus/no-conditional-empty-object-spread": "error",
    "nopeus/no-known-value-widening": "error",
    "nopeus/no-module-mocking": "error",
    "nopeus/no-object-parameters": "error",
    "nopeus/no-reflect-apply": "error",
    "nopeus/no-reflect-get": "error",
    "nopeus/no-runtime-typeof": ["error", { allowInTypeGuards: true }],
    "nopeus/no-type-assertions": "error",
    "nopeus/no-unknown-returns": "error",
    "nopeus/no-unknown-type-aliases": "error",
    "nopeus/no-unsafe-dictionary-type": "error",
    "nopeus/require-public-jsdoc": "error",
  },
});
