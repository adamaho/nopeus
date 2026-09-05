# @nopeus/tool-tsdown-config

Shared library build defaults for this workspace. Add
`@nopeus/tool-tsdown-config: "workspace:*"` and `tsdown: "catalog:"` to the
consuming package's devDependencies, then create `tsdown.config.ts`:

```ts
import { defineTsdownConfig } from "@nopeus/tool-tsdown-config";

export default defineTsdownConfig({
  entry: ["src/index.ts"],
});
```

Use `"build": "tsdown"` in the package's scripts. Defaults are ESM output,
declaration files, source maps, and the `dist` output directory. Entry points
remain explicit because each package exposes a different API.

Pass ordinary tsdown options to override any default:

```ts
export default defineTsdownConfig({
  entry: ["src/index.ts", "src/client.ts"],
  sourcemap: false,
  outDir: "build",
});
```

Options replace defaults directly; objects and arrays are not deep-merged.
The helper uses tsdown's own `UserConfig` type and adds no custom configuration
syntax. Keep the tsdown peer version aligned with the workspace catalog.

This package is private workspace tooling. It is not an npm dependency for
users of the published Oxlint packages and requires no Effect tooling.
