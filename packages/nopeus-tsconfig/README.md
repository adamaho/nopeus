# @adamaho/nopeus-tsconfig

Canonical TypeScript compiler policy for Nopeus projects.

| Config                            | Policy                                                        |
| --------------------------------- | ------------------------------------------------------------- |
| `@adamaho/nopeus-tsconfig/base`   | Strict TypeScript defaults.                                   |
| `@adamaho/nopeus-tsconfig/effect` | Base defaults plus all canonical Effect compiler diagnostics. |

Combine one policy with an environment: `/node` supplies NodeNext resolution,
ES2022 libraries, and Node types; `/vite` supplies bundler resolution, ES2022 and
browser libraries, and Vite client types. Environment configs do not extend a
policy or change its strictness or Effect diagnostics.

All exports are plain JSON. The package has no dependencies, compiler patches,
or installation scripts. JSX, paths, included files, and build output settings
belong to the consuming project.

## Install

Use the same authenticated GitHub Packages setup as the other Nopeus packages:

```ini
@adamaho:registry=https://npm.pkg.github.com
```

```bash
pnpm add -D -E @adamaho/nopeus-tsconfig typescript@7.0.2
```

For a Vite project without Effect, install `vite` as a development dependency
and combine `/base` with `/vite`:

```json
{
  "extends": ["@adamaho/nopeus-tsconfig/base", "@adamaho/nopeus-tsconfig/vite"],
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
diagnostics. For a Node project, combine it with `/node`:

```json
{
  "extends": ["@adamaho/nopeus-tsconfig/effect", "@adamaho/nopeus-tsconfig/node"]
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
Install `@types/node` when using `/node`. Vite projects using Effect combine
`/effect` with `/vite` and install `vite`. Neither environment preset installs
these dependencies automatically. `/node` excludes browser globals; `/vite`
excludes automatically included Node globals. React projects set their own JSX
option and install the React types they need.

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

Keep thin `tools/tsconfig` wrappers to select a policy and environment once per
repository. Packages can continue extending those wrappers and owning their
source paths and build settings. The environment presets leave output and
project-reference settings untouched. Arrays such as `types` and `lib` replace
inherited arrays; include every required entry when overriding them.
