# @adamaho/nopeus-oxlint-plugin

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
