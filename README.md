# Nopeus

AI tooling for faster, more effective software development.

| What you want                          | Use                                                 | Effect tooling required?                      |
| -------------------------------------- | --------------------------------------------------- | --------------------------------------------- |
| Built-in Oxlint rules                  | `@adamaho/nopeus-oxlint-config`                     | No                                            |
| General custom TypeScript rules        | `@adamaho/nopeus-oxlint-plugin/base`                | No                                            |
| General and Effect syntax rules        | `@adamaho/nopeus-oxlint-plugin/effect`              | No                                            |
| Effect compiler and editor diagnostics | Opt-in [Effect LSP setup](tools/tsconfig/README.md) | Yes: `@effect/tsgo` and compatible TypeScript |

See the [plugin documentation](packages/nopeus-oxlint-plugin/README.md) for the
base-only installation and the optional Effect integrations.
