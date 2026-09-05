# Nopeus

AI tooling for faster, more effective software development.

| What you want                          | Use                                    | Effect tooling required?                      |
| -------------------------------------- | -------------------------------------- | --------------------------------------------- |
| Built-in Oxlint rules                  | `@adamaho/nopeus-oxlint-config`        | No                                            |
| General custom TypeScript rules        | `@adamaho/nopeus-oxlint-plugin/base`   | No                                            |
| General and Effect syntax rules        | `@adamaho/nopeus-oxlint-plugin/effect` | No                                            |
| Strict TypeScript compiler policy      | `@adamaho/nopeus-tsconfig/base`        | No                                            |
| Effect compiler and editor diagnostics | `@adamaho/nopeus-tsconfig/effect`      | Yes: `@effect/tsgo` and compatible TypeScript |

See the [plugin documentation](packages/nopeus-oxlint-plugin/README.md) for the
base and Effect syntax presets. The [TypeScript config package](packages/nopeus-tsconfig/README.md)
owns the shared compiler policy and Effect compiler setup.

Workspace builds use the [shared tsdown helper](tools/tsdown-config/README.md).
The [downstream rollout checklist](docs/consumer-rollout.md) tracks adoption in
Goho and monorepo after release.
