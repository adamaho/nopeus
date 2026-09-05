# @adamaho/nopeus-oxlint-plugin

## 0.3.0

### Minor Changes

- 4414544: Replace `require-service-make-layer` with `require-service-constructor-names`,
  always enabled in the canonical Effect preset. Public Layers use `layer` or
  `layerX`; public service constructors use `make` or `makeX`. Neither requires the
  other, constructors may remain private, and suffixes do not need to match.

  Allow parameterized factories, inline construction, config wrappers, and Layer
  composition. Remove the old pairing rule entirely. Consumers that explicitly
  reference its name must remove that entry when upgrading; canonical preset
  consumers receive the replacement automatically.

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

- Add the initial Nopeus Oxlint plugin with a canonical `effect` profile, strict type-evidence rules, and Effect-style public API JSDoc enforcement.

- Add Effect v4 runtime-boundary, typed-error, platform-service, void, fiber, Layer
  composition, and service make/layer rules to the canonical Effect profile.
