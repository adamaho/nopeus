# @adamaho/nopeus-oxlint-config

Shared base Oxlint configuration for strict TypeScript codebases.

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
