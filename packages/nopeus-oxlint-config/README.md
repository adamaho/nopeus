# @adamaho/nopeus-oxlint-config

Shared configuration selecting built-in Oxlint rules for TypeScript codebases.
This package has no Effect runtime or LSP dependency.

## Usage

Install the config and its Oxlint peer:

```bash
pnpm add --save-dev @adamaho/nopeus-oxlint-config oxlint
```

Extend the base config from an `oxlint.config.ts` file:

```ts
import base from "@adamaho/nopeus-oxlint-config";
import { defineConfig } from "oxlint";

export default defineConfig({
  extends: [base],
});
```

Oxlint does not resolve package imports from `.oxlintrc.json`; use a TypeScript
config when consuming this package.

The package publishes compiled ESM and requires Node.js 22.18 or newer, or
Node.js 24 or newer.

## Custom Nopeus rules

The separate `@adamaho/nopeus-oxlint-plugin` package implements custom rules.
Its `/base` preset adds general TypeScript rules without requiring any Effect
packages. Its `/effect` preset adds Effect syntax checks, including the v4 import
restrictions previously included in this base config. Use the Effect preset
for Effect projects. See the [plugin setup](../nopeus-oxlint-plugin/README.md).
