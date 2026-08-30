# Contributing

Nopeus houses AI-assisted development tools. Keep changes small, explicit,
and easy to review.

## Prerequisites

Install these before working in the repo:

- [Nix](https://nixos.org/download/)
- [Docker](https://docs.docker.com/get-docker/)

## Development Setup

Enter the Nix development shell before running project commands:

```bash
nix develop
```

Install dependencies:

```bash
pnpm install
```

Start local infrastructure when a package needs shared runtime services:

```bash
pnpm --filter=@monorepo/infra-local run infra:up
```

## Verification

Run the full local verification command before opening a PR or committing a
completed change:

```bash
pnpm check
```

This runs the repository format check first, then lets Turbo run package-level
lint and TypeScript tasks in parallel where packages define them.

Useful focused commands:

- `pnpm fmt` formats the repository
- `pnpm fmt:check` checks formatting without writing changes
- `pnpm lint` runs package lint tasks through Turbo
- `pnpm turbo run test:unit` runs package unit test tasks through Turbo
- `pnpm tsc` runs package TypeScript tasks through Turbo

## Workspace Layout

Use the existing top-level workspace directories consistently:

- `programs/*` for deployable applications, APIs, workers, and other executables
- `packages/*` for shared features, reusable libraries, and external service clients
- `tools/*` for internal tooling packages
- `infra/*` for local and shared infrastructure helpers

Programs are deployable entry points and should stay thin.
Keep code used by only one deployable local to it, such as under
`programs/web/src/features/*`. Move a feature or capability into `packages/*`
when it becomes shared or needs an explicit public API and dependency boundary.

Do not apply category-based prefixes or suffixes to packages under `packages/*`.
The directory name must match the package's `package.json` name, excluding the
npm scope when present. For example, `packages/oxlint-policy/package.json`
may use the name `@adamaho/noveus-oxlint-policy`.

## Dependency Management

Prefer centralizing shared dependency versions in `pnpm-workspace.yaml` using
the catalog. This keeps package manifests small and makes upgrades easier to
review.

Use exact versions. The root `.npmrc` sets `save-exact=true` and
`engine-strict=true`.

## Changesets

Add a changeset when a pull request changes the public behavior of a publishable
package:

```bash
pnpm changeset
```

Select every affected package, choose the appropriate semantic version bump,
and commit the generated `.changeset/*.md` file with the change.

A changeset is not required for documentation, infrastructure,
application-only, or private-package changes. Run `pnpm changeset:status` to
inspect pending releases.

## Documentation Comments

Use JSDoc when it helps consumers understand an exported API. Use comments for
non-obvious behavior, invariants, side effects, failure semantics, lifecycle
requirements, intent, and tradeoffs.

Private helpers with clear names and TypeScript types do not require JSDoc. Do
not add `@param` or `@returns` tags when they merely repeat names and types
already expressed by TypeScript. Tests, fixtures, and straightforward
transformations generally do not need JSDoc.

Comments should explain why, not restate what the code does.

## Commit Messages

Prefer using the configured coding agent commit workflow when creating commits.
The agent formats the repo, stages the intended changes, writes a compliant
commit message, and pushes to the current branch.

Commit subjects must use scoped Conventional Commit format:

```text
<type>(<scope>): <description>
```

Allowed types:

- `feat`
- `fix`
- `docs`
- `chore`
- `refactor`
- `test`

Use the affected package name without the npm scope as the commit scope. For
root-only changes, use `nopeus`.

Examples:

```text
chore(nopeus): add contributor documentation
feat(web): add account settings page
fix(api): validate missing request body
```

## Coding Agents

Start coding agents from inside the Nix shell so their commands use the same
toolchain as local development:

```bash
nix develop
opencode
```

If an agent was not started inside `nix develop`, run verification commands
through Nix explicitly:

```bash
nix develop --command pnpm check
```
