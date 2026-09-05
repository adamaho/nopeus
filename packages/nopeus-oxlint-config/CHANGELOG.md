# @adamaho/nopeus-oxlint-config

## 0.2.0

### Minor Changes

- 298bfdf: Add canonical rules for construction-owned mutable state and forwarding
  Effect.tryPromise cancellation to global fetch. Document their supported syntax
  and intentional exceptions with Effect v4 examples.

  The plugin retains its ordinary Oxlint installation. Official Effect type-aware
  diagnostics are enforced separately by the shared TypeScript configuration and
  patched tsc; the README links to that setup. Existing Nopeus rules remain
  enabled, and previously accepted code can now report the two additional errors.

  Expose the plugin's general custom rules through `/base`; `/effect` includes them
  and adds Effect-specific syntax checks. Move v4 import restrictions from the
  built-in base config to the Effect preset. Neither published preset requires
  Effect runtime or LSP packages. The private TypeScript configs now expose the
  Effect compiler policy as an explicit `/effect` overlay.

## 0.1.2

### Patch Changes

- 196ba7b: Publish compiled JavaScript entrypoints so Node.js can load both packages from `node_modules` while workspace consumers continue using the TypeScript source.

## 0.1.1

### Patch Changes

- 800e9be: Publish the config and plugin privately under the `@adamaho/nopeus-*` names through GitHub Packages.

## 0.1.0

### Minor Changes

- Publish the shared base Oxlint configuration as an npm package.
