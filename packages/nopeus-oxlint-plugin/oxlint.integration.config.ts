import { defineConfig } from "oxlint";

import builtins from "../nopeus-oxlint-config/src/base.ts";

export default defineConfig({
  extends: [builtins],
  jsPlugins: [{ name: "nopeus", specifier: "./src/index.ts" }],
  rules: { "nopeus/no-export-assignment": "error" },
});
