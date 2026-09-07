# @adamaho/nopeus-oxlint-config

## 0.3.0

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
