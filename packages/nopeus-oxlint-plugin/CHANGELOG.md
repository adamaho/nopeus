# @adamaho/nopeus-oxlint-plugin

## 0.6.0

### Minor Changes

- a92195d: Limit require-effect-namespace to traced functions and explicit span names, requiring @project/Domain.operation with PascalCase domain segments and a camelCase operation. Restore the separate service-key prefix rule in the Effect preset and extend it to Context.Reference with scope-aware import resolution. Stop enforcing trace prefixes on schema identifiers, data/error/request tags, and metrics so adopting the trace policy does not change serialization contracts.

## 0.5.0

### Minor Changes

- dbb0bdb: Enforce the repository namespace across Effect service/reference keys, traced functions and spans, schema class identifiers, tagged data/errors/requests, and metric names. The Effect preset replaces require-service-key-prefix with require-effect-namespace; the original service-only rule remains available for manual configurations. Existing identifiers may need renaming, including their serialized tags and matching code. Accept namespaced Effect.fn owner names and resolve imported bindings without confusing shadowed locals.

### Patch Changes

- 596c9d8: Update the Oxlint plugin runtime dependency to 1.81.0.

## 0.4.0

### Minor Changes

- 55b5db9: Enforce kebab-case source filenames and add canonical package/test boundaries.
  The base and Effect presets require named tests under each package's sibling
  test directory, prevent production imports of test code, and require public
  entrypoints for cross-package imports. TypeScript aliases and workspace symlinks
  are resolved through the new oxc-resolver dependency.

  Previously accepted filenames, test locations, and internal imports may now
  report errors. Move tests from src to test, rename spec files to test files,
  and replace cross-package filesystem imports with public package imports.

- 29cd132: Fix package ownership for public exports inside directories whose package.json
  only declares a module type. These directories no longer incorrectly create
  separate package boundaries; real nested packages remain isolated.

  Require ESM source and tests. The built-in config now rejects require calls,
  TypeScript import-equals, module.exports, and exports assignments. The plugin's
  base and Effect presets also reject TypeScript export assignments with the new
  no-export-assignment rule.

  Replace CommonJS syntax with ESM import/export syntax when upgrading both
  packages. ESM imports of dependencies implemented in CommonJS remain allowed.

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
