# @adamaho/nopeus-tsconfig

## 0.1.0

### Minor Changes

- 3e78387: Publish the shared strict TypeScript policy as plain JSON configs. `/base`
  provides the canonical compiler defaults; `/effect` extends it with all eight
  canonical Effect diagnostics. Neither config installs packages or patches a
  compiler. Runtime-specific settings stay in consuming repositories.
