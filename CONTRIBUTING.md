# Contributing

Nopeus houses AI-assisted development tools. Keep changes small, explicit,
and easy to review.

## Prerequisites

Install these before working in the repo:

- [Node.js 24.15.0](https://nodejs.org/en/download)
- [pnpm 12.3.4](https://pnpm.io/installation)
- [Docker](https://docs.docker.com/get-docker/)

## Development Setup

Set `NODE_AUTH_TOKEN` to a GitHub classic PAT with `read:packages` access to
private `@adamaho` packages. Use a personal token per developer; reserve a
read-only machine-user token for shared unattended access. GitHub Packages does
not accept Amp OIDC, and orb setup does not inherit normal GitHub credentials.
The committed `.npmrc` contains only the registry route and the literal
`${NODE_AUTH_TOKEN}` reference, never the secret value.
Orb setup persistently sets `PNPM_CONFIG_NPMRC_AUTH_FILE` to that repository
file so setup and later `pnpm add` or `pnpm update` commands use the same
runtime secret without creating another npmrc.

```bash
export NODE_AUTH_TOKEN=...
```

Then install dependencies from the lockfile:

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

Keep package directory names concise and domain-based. Publishable packages use
the `@adamaho` scope and the `nopeus-` name prefix. For example,
`packages/nopeus-oxlint-plugin/package.json` uses the published name
`@adamaho/nopeus-oxlint-plugin`.

## Source and Test Layout

Use lowercase kebab-case for ordinary source and test filenames. Use `test/`
(singular) alongside `src/` in each package or program, and name executable
tests `*.test.ts` (or the corresponding JavaScript/TSX extension). Module tests
should mirror the source path; a test for `src/users/service.ts` belongs at
`test/users/service.test.ts`. Mirroring is guidance, not a requirement to create
a test for every source file.

| Location                                  | Purpose                                                  |
| ----------------------------------------- | -------------------------------------------------------- |
| `src/users/service.ts`                    | Feature implementation                                   |
| `test/users/service.test.ts`              | Focused feature behavior                                 |
| `test/integration/users-database.test.ts` | Behavior across real dependencies                        |
| `test/e2e/server.test.ts`                 | Requests against a running program                       |
| `test/package/installation.test.ts`       | Installation and loading of a distributable package      |
| `test/helpers/users-test-layer.ts`        | Test dependencies shared by multiple tests               |
| `test/fixtures/`                          | Static inputs and intentionally invalid fixture projects |

Create only the directories a project needs. Programs such as an Effect web
server usually use feature tests and, when needed, integration or end-to-end
tests. Package installation tests are for distributable libraries and tools.
Keep helpers local until multiple tests need them. Effect tests provide test
Layers through the same service contracts used in production.

Tests may import their own package's source, including internals when needed.
Production files under `src/` must not import tests, helpers, or fixtures.
Across packages, use the package name and its public exports, including public
subpath exports, instead of relative paths into another package. TypeScript
aliases must not bypass that boundary.

Lint both `src/` and `test/`, and typecheck test helpers as well as test files.
Keep production build entrypoints scoped to `src/`. Deliberately invalid fixture
files need an explicit, narrow lint/typecheck exclusion; ordinary tests retain
the project's lint policy. Do not exclude the entire `test/` directory.

The Oxlint plugin runs module tests with `test:unit`, CLI integration tests with
`test:integration`, and isolated package installation tests with `test:package`.
Their discovery patterns are disjoint; fixture/helper files are not test suites.

## Dependency Management

Prefer centralizing shared dependency versions in `pnpm-workspace.yaml` using
the catalog. This keeps package manifests small and makes upgrades easier to
review.

Use exact versions. `pnpm-workspace.yaml` enables `saveExact` and
`engineStrict`.

The workspace enforces a one-day (`1440` minute) minimum release age for direct
and transitive third-party dependencies. Resolution fails when no old-enough
version satisfies the requested range or when a third-party registry omits
publish timestamps. The `@adamaho/*` scope is excluded so a newly published
private first-party package can be consumed immediately. Keep exceptions scoped
to that organization; use a reviewed, version-specific
`minimumReleaseAgeExclude` entry if an urgent third-party release cannot wait.

`trustLockfile` remains disabled, so `pnpm install --frozen-lockfile` verifies
the committed lockfile against the release-age policy while preventing lockfile
changes. The policy cannot protect the official pnpm/Node bootstrap itself,
which uses exact versions before workspace configuration is available.

GitHub Actions uses its job-scoped `github.token` instead of a PAT and declares
`packages: read`. Consumer repositories must also have Read access under each
private package's **Manage Actions access** settings; workflow permissions alone
do not grant package access.

After Changesets publishes a release, the publish workflow updates all three
Nopeus catalog entries and lockfile resolutions on dedicated branches in Goho
and adamaho/monorepo, then opens or refreshes exact-version pull requests against
their `dev` branches. `ADAMAHO_BOT_PAT` needs cross-repository write access for
those branches and pull requests. The resulting consumer PR workflows use their
own `github.token` for package installation and still require the package access
described above.

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

Use the affected workspace directory name as the commit scope. For root-only
changes, use `nopeus`.

Examples:

```text
chore(nopeus): add contributor documentation
feat(nopeus-oxlint-plugin): add strict Effect rule
fix(nopeus-oxlint-plugin): recognize aliased imports
```

## Coding Agents

Before starting a coding agent, verify that its shell resolves the pinned
toolchain:

```bash
node --version
pnpm --version
```

The versions must be Node `v24.15.0` and pnpm `12.3.4`. Run verification
directly:

```bash
pnpm check
```
