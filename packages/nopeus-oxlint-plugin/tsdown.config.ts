import { defineTsdownConfig } from "@nopeus/tool-tsdown-config";

export default defineTsdownConfig({
  entry: ["src/index.ts", "src/base.ts", "src/effect.ts", "src/eslint.ts"],
});
