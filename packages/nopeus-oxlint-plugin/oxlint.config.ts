import { defineConfig } from "oxlint";

import builtins from "../nopeus-oxlint-config/src/base.ts";

export default defineConfig({
  extends: [builtins],
  jsPlugins: [{ name: "nopeus", specifier: "./src/index.ts" }],
  rules: {
    "nopeus/no-export-assignment": "error",
    "nopeus/no-cross-package-internals": "error",
    "nopeus/no-test-imports": "error",
    "nopeus/require-test-location": "error",
  },
  ignorePatterns: ["test/fixtures/**"],
});
