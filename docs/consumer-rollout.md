# Downstream rollout

After this PR merges and the new Oxlint packages are published, open follow-up
PRs in [Goho](https://github.com/adamaho/goho) and
[monorepo](https://github.com/adamaho/monorepo). These upgrades are pending;
the current PR only changes Nopeus.

## Shared steps

- Update both Nopeus package catalog entries from `0.1.2` to the published
  versions and regenerate each repository's lockfile.
- Keep `oxlint@1.79.0`, which already satisfies the plugin peer range
  `>=1.79.0 <2`. Base rules and Effect syntax rules need no Effect compiler
  integration, Effect runtime peer, or `oxlint-tsgolint`.
- For Effect compiler diagnostics, update `@effect/tsgo` from `0.36.5` to the
  tested `0.41.0`, paired with `typescript@7.0.2`. Retain the existing
  `effect-tsgo patch` preparation step where that integration is used.
- Move the Effect plugin entry out of each shared base tsconfig into an
  explicit `effect` overlay. Copy the eight diagnostic severities and exit-code
  policy from [Nopeus's overlay](../tools/tsconfig/src/effect.json), export it
  from the local tsconfig tool, and extend it only in Effect projects.
- Run installation scripts, formatting, lint, type checks, existing Vitest
  suites, and builds. Fix newly reported violations before merging the upgrade.
  Confirm a base-only project can install and lint without Effect tooling.

## Goho

- Keep the Effect preset in `packages/core/oxlint.config.ts` and
  `programs/goho-cli/oxlint.config.ts`, including the CLI's `src/main.ts`
  runtime entry point. Opt those Effect projects into the compiler overlay.
- Goho currently uses Effect `4.0.0-rc.111`; Nopeus fixtures use
  `4.0.0-rc.112`. Check compatibility against Goho's application tests. If
  upgrading the runtime, update its related Effect packages together.
  `@effect/vitest` is only needed for Effect-aware tests.
- Keep general tooling projects on the base or service tsconfig without the
  Effect overlay.

## Monorepo

- The root `oxlint.config.ts` currently enables the Effect preset for the whole
  repository. Make the general template use `@adamaho/nopeus-oxlint-plugin/base`
  alongside `@adamaho/nopeus-oxlint-config`; let Effect workspaces opt into
  `/effect` explicitly.
- For a base-only template, remove the unconditional Effect compiler patch and
  `@effect/tsgo` development dependency. Document their installation with the
  optional Effect overlay so generated non-Effect projects stay lightweight.

## Shared builds

The new [tsdown helper](../tools/tsdown-config/README.md) is private to Nopeus.
If either downstream repository needs these defaults, add the corresponding
local tool package and workspace dependency there; do not try to install
`@nopeus/tool-tsdown-config` from npm. Keep entries in each consuming
`tsdown.config.ts` and retain package-specific overrides.
