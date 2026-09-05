# @adamaho/nopeus-tsconfig

Canonical TypeScript compiler policy for Nopeus projects.

| Config                            | Policy                                                        |
| --------------------------------- | ------------------------------------------------------------- |
| `@adamaho/nopeus-tsconfig/base`   | Strict TypeScript defaults.                                   |
| `@adamaho/nopeus-tsconfig/effect` | Base defaults plus all canonical Effect compiler diagnostics. |

Both exports are plain JSON. The package has no dependencies, compiler patches,
or installation scripts. Module resolution, JSX, paths, included files, and build
output settings belong to the consuming project.

## Install

Use the same authenticated GitHub Packages setup as the other Nopeus packages:

```ini
@adamaho:registry=https://npm.pkg.github.com
```

```bash
pnpm add -D -E @adamaho/nopeus-tsconfig typescript@7.0.2
```

For a project without Effect:

```json
{
  "extends": "@adamaho/nopeus-tsconfig/base",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler"
  },
  "include": ["src/**/*.ts"]
}
```

The base policy enables strict checking, exact optional properties, checked index
access, unused-local checks, explicit overrides, isolated modules, verbatim
module syntax, and TypeScript import extensions. It targets ES2022, checks
without emitting, and skips dependency declaration checking. A project that owns
its build output can set its own emit options.

## Effect projects

Use `/effect` to inherit the base policy and all eight canonical Effect
diagnostics. Keep runtime-specific settings in the repository's shared config:

```json
{
  "extends": "@adamaho/nopeus-tsconfig/effect",
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "types": ["node"]
  }
}
```

Install the compiler integration in the workspace that owns TypeScript:

```bash
pnpm add -D -E @effect/tsgo@0.41.0
```

Retain the project's existing preparation commands and add the compiler patch:

```json
{
  "scripts": {
    "prepare": "effect-tsgo patch",
    "typecheck": "tsc --noEmit"
  }
}
```

Run `pnpm install` after adding the preparation step. CI must run installation
scripts before typechecking. The JSON config supplies policy; the patched
compiler executes Effect diagnostics. An unpatched compiler does not enforce
them. Keep TypeScript and `@effect/tsgo` on compatible versions; the tested pair
is TypeScript 7.0.2 with `@effect/tsgo` 0.41.0 and Effect 4.0.0-rc.112.
Node projects also install `@types/node` for their local `types` setting.

| Diagnostic                | Required behavior                                               |
| ------------------------- | --------------------------------------------------------------- |
| `floatingEffect`          | Execute, return, or retain Effects.                             |
| `returnEffectInGen`       | Use `return yield*` to execute returned Effects in generators.  |
| `effectInVoidSuccess`     | Avoid unexecuted Effects inside a void success value.           |
| `lazyPromiseInEffectSync` | Adapt Promise work with an Effect Promise adapter.              |
| `promiseInEffectSuccess`  | Avoid wrapping Promises as success values.                      |
| `schemaSyncInEffect`      | Use Effect-returning schema decoders inside Effect workflows.   |
| `leakingRequirements`     | Capture implementation dependencies when constructing services. |
| `floatingEffectInVitest`  | Execute Effects through the Effect-aware test API.              |

These diagnostics are errors and cause a failing `tsc` exit code. Other upstream
diagnostics retain their defaults. A child config's `compilerOptions.plugins`
replaces the inherited array, so preserve the Effect entry if adding another
compiler plugin.

For editor support, run `pnpm exec effect-tsgo setup` and follow the
[official editor instructions](https://github.com/Effect-TS/tsgo#installation).
Compiler patching and editor language-server selection are separate setup steps.

## Shared repository configs

Keep existing `tools/tsconfig` wrappers for Node/Vite settings. Their base config
can extend `/base`; their Effect service config can extend `/effect`. Packages
continue extending the repository wrappers, so compiler-policy upgrades only
require changing the shared package version and lockfile.
