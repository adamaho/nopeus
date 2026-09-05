# Downstream rollout

[Goho #4](https://github.com/adamaho/goho/pull/4) and
[monorepo #6](https://github.com/adamaho/monorepo/pull/6) are merged. Both use
`@adamaho/nopeus-oxlint-plugin@0.3.0`, `@adamaho/nopeus-oxlint-config@0.2.0`,
Oxlint 1.79.0, TypeScript 7.0.2, and `@effect/tsgo@0.41.0`.

## Shared TypeScript policy

After `@adamaho/nopeus-tsconfig` is released, update both repositories:

- Add its exact published version to the catalog and a catalog dependency in
  `tools/tsconfig/package.json`. Regenerate the lockfile.
- Replace duplicated strict settings in the shared base config with an
  extension of `@adamaho/nopeus-tsconfig/base`.
- Replace the copied Effect diagnostics in the shared service config with an
  extension of `@adamaho/nopeus-tsconfig/effect`. Retain local NodeNext, emit,
  and build settings. All services in both repositories use Effect.
- Keep Vite/React environment settings local and based on the base policy.
- Retain the existing compiler patch preparation step and compatible compiler
  versions. The JSON package does not install the Effect toolchain.
- Run authenticated frozen installation, formatting, lint, and typechecking.

Goho keeps its Effect rc.111 runtime family and credential configuration in the
CLI. The template keeps Effect rc.112 and the complete Effect preset by default.
Existing packages continue extending their local service config.

## Shared builds

The [tsdown helper](../tools/tsdown-config/README.md) remains private to Nopeus.
Keep package-specific entry points and build settings in consuming repositories.
