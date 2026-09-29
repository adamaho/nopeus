# @adamaho/nopeus-oxlint-config

Ordinary source and test filenames use kebab-case through the built-in
`unicorn/filename-case` rule: `user-service.ts`, `user-service.test.ts`, and
`effect.integration.test.ts`. `index.ts` and compound extensions such as `.d.ts`
retain Oxlint's built-in handling. Framework-mandated filenames should have a
narrow, documented override in the consuming project's config.

Use ESM imports and exports. `typescript/no-require-imports` rejects `require()`
(including conditional calls) and `import x = require(...)`;
`import/no-commonjs` rejects `module.exports` and `exports.*`. The custom plugin
also rejects TypeScript's `export =` syntax. ESM imports of dependencies that
internally use CommonJS remain allowed.

The built-in `import/newline-after-import` rule requires a blank line after the
last import before other code.

Package/test ownership is enforced separately by the custom plugin's `/base`
and `/effect` presets.

Use package-local Node import aliases for imports that would climb to a parent
directory. `import/no-relative-parent-imports` rejects `../` and `../../` imports
in source and tests. Same-directory `./` imports remain allowed.

Define aliases in each package's `package.json`, preserving file extensions:

```json
{
  "imports": {
    "#src/*": "./src/*",
    "#test/*": "./test/*"
  }
}
```

For example, use `#src/receipts/repository.ts` instead of
`../../src/receipts/repository.ts`. Across packages, use the target package's
name and public exports.

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
config when consuming this package. To check that the installed config loads,
run:

```bash
pnpm exec oxlint --config oxlint.config.ts src
```

The package publishes compiled ESM and requires Node.js 22.18 or newer, or
Node.js 24 or newer.

## Custom Nopeus rules

The separate `@adamaho/nopeus-oxlint-plugin` package implements custom rules.
Its `/base` preset adds general TypeScript rules without requiring any Effect
packages. Its `/effect` preset adds Effect syntax checks, including the v4 import
restrictions previously included in this base config. Use the Effect preset
for Effect projects. See the [plugin setup](../nopeus-oxlint-plugin/README.md).
