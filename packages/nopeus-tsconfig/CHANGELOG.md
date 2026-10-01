# @adamaho/nopeus-tsconfig

## 0.3.2

### Patch Changes

- 122c8ba: Disable the Effect `unstableApiUsage` diagnostic in the shared Effect preset so projects can intentionally use unstable APIs.

## 0.3.1

### Patch Changes

- b3d3d4e: Document commands for checking installed Oxlint and TypeScript configs.

## 0.3.0

### Minor Changes

- 84a837a: Report `lazyEffect`, `preferSucceedSomeOrNone`, and `unnecessaryTypeofType` as errors in the shared Effect TypeScript policy.

## 0.2.0

### Minor Changes

- 28a0d4f: Add dependency-free Node and Vite environment configs that compose with the base
  or Effect compiler policy. Runtime types are installed by the consuming project.

## 0.1.0

### Minor Changes

- 3e78387: Publish the shared strict TypeScript policy as plain JSON configs. `/base`
  provides the canonical compiler defaults; `/effect` extends it with all eight
  canonical Effect diagnostics. Neither config installs packages or patches a
  compiler. Runtime-specific settings stay in consuming repositories.
