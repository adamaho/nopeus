# @adamaho/nopeus-oxfmt-config

Shared Oxfmt configuration with import sorting and explicit formatting defaults.
The package publishes compiled ESM and TypeScript declarations, with equivalent
default exports at the package root and `/base`.

## Usage

Install the config and its Oxfmt peer:

```bash
pnpm add --save-dev @adamaho/nopeus-oxfmt-config 'oxfmt@^0.71.0'
```

Create `oxfmt.config.ts` in the project root:

```ts
import base from "@adamaho/nopeus-oxfmt-config";

export default base;
```

Oxfmt discovers this file automatically. Add formatting scripts:

```json
{
  "scripts": {
    "fmt": "oxfmt .",
    "fmt:check": "oxfmt --check ."
  }
}
```

Use one Oxfmt config per directory; replace an existing `.oxfmtrc.json` or
`.oxfmtrc.jsonc` when adopting the TypeScript config. Install `oxfmt` locally
so editor integrations use the same formatter as the CLI.

Requires Node.js `^22.18.0 || >=24.0.0` and Oxfmt `^0.71.0`.

## Base settings

| Setting              | Value   |
| -------------------- | ------- |
| `printWidth`         | `100`   |
| `tabWidth`           | `2`     |
| `useTabs`            | `false` |
| `semi`               | `true`  |
| `singleQuote`        | `false` |
| `sortImports`        | `true`  |
| `trailingComma`      | `"all"` |
| `endOfLine`          | `"lf"`  |
| `insertFinalNewline` | `true`  |

Other options retain Oxfmt defaults, including enabled package.json sorting.
The base does not include project-specific ignores, overrides, or Tailwind paths.

## Project customization

Oxfmt composes configurations with JavaScript imports and spreads, without an
`extends` option:

```ts
import base from "@adamaho/nopeus-oxfmt-config/base";
import { defineConfig } from "oxfmt";

export default defineConfig({
  ...base,
  printWidth: 120,
  ignorePatterns: ["generated/**"],
  overrides: [
    {
      files: ["**/*.md"],
      options: { proseWrap: "always" },
    },
  ],
});
```

Spreads are shallow: arrays and nested objects replace previous values unless
you explicitly merge them. Ignore patterns, override globs, and Tailwind paths
are relative to the consuming config file. Nested configs replace the parent
config, so import this base in each nested config that should share its settings.

See the [Oxfmt configuration documentation](https://oxc.rs/docs/guide/usage/formatter/config.html).
