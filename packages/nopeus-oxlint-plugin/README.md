# `@adamaho/nopeus-oxlint-plugin`

Strict Oxlint rules for preserving type evidence and explicit architecture in
AI-assisted TypeScript codebases.

The package combines and adapts the MIT-licensed rules from
[dmmulroy/anti-slop](https://github.com/dmmulroy/anti-slop) and
[HumanLayer's Effect Machine](https://github.com/humanlayer/effect-machine/tree/main/tools/oxlint/anti-slop).

## Usage

Install the plugin and its Oxlint peer:

```bash
pnpm add --save-dev @adamaho/nopeus-oxlint-plugin oxlint
```

Use the recommended policy from an `oxlint.config.ts` file:

```ts
import packageJson from "./package.json" with { type: "json" };
import recommended from "@adamaho/nopeus-oxlint-plugin/recommended";
import { defineConfig } from "oxlint";

export default defineConfig({
  extends: [recommended({ packageName: packageJson.name })],
});
```

The package also exports the plugin directly for projects that want to select
rules individually:

```ts
import { defineConfig } from "oxlint";

export default defineConfig({
  jsPlugins: [
    {
      name: "nopeus",
      specifier: "@adamaho/nopeus-oxlint-plugin",
    },
  ],
  rules: {
    "nopeus/no-known-value-widening": "error",
  },
});
```

## Policy

The recommended config rejects patterns that discard type evidence, including
chained assertions, widening known values before asserting them back, vague
object and dictionary contracts, unknown returns and aliases, reflective calls,
and module mocking.

Effect-specific rules keep service constructors inside their owning modules,
require static operation names for `Effect.fn`, and require
`Context.Service` keys to be static and namespaced. The service-key rule
prescribes a repository-specific prefix derived from the root package name. For
example, `goho` and `@adamaho/goho` both require service keys beginning with
`@goho/`.

The following lower-signal rules are included but deliberately disabled by the
recommended config:

- `no-conditional-empty-object-spread`
- `no-runtime-typeof`
- `no-shape-in-symbol-names`
