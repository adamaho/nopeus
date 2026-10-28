# Nopeus skills

The canonical collection of shared agent skills, organized as the workspace package
`@adamaho/nopeus-skills`. It is public on GitHub and is not published to npm. Each skill uses the portable `SKILL.md` format.

## Start with build

[`build`](skills/build/SKILL.md) is the main entry point for working on a feature,
bug, or fix. It is a composition of the focused skills in this package: it chooses
and coordinates them as needed, keeps the work moving one slice at a time, and
resumes from existing progress. You do not need to invoke each supporting skill.

For example:

- "Use build to work through organization invitations with me."
- "Use build to complete the next agreed slice and leave the PR ready for review."
- "Use build to fix the empty-state bug."
- "Use build with tickets to track the organization invitations work."

A request limited to refinement or planning stays within that scope. An end-to-end
build includes implementation and PR work, and stops before the final feature
merge. Focused skills remain available directly for tasks such as summarizing a
PR or refining an idea without implementing it.

### Build with or without tickets

`build` works without tickets by default. It:

- Skips ticket drafting, creation, mapping, and updates, including existing tickets.
- Requires no tracker access or ticket destinations.
- Keeps the spec, graph, progress, and evidence together in requested local files
  or the ignored `.scratch/specs/` directory.
- Preserves refinement, PR planning, implementation, validation, independent
  review, and detailed summaries.

If you want tickets, say **"build with tickets"**. This includes `create-ticket`
for a parent holding the spec and graph and a child per PR group, reusing existing
tracking where possible. The choice persists when resuming a build.

## Skills

- `adhd`: clear, concise communication on any topic.
- `refine`: explore software ideas and resolve decisions with the human.
- `spec`: define behavior, architecture, contracts, and acceptance for software changes.
- `summarize`: explain changes, architecture, interfaces, public APIs, and data structures; provide the mandatory implementation handoff.
- `audit`: simplify specs and code changes, reusing test coverage and removing redundancy.
- `graph`: plan and maintain implementation dependencies, PR groups, and completion requirements.
- `build`: compose the supporting skills into one workflow, with optional tickets and a detailed implementation summary.
- `execute`: carry out a ready spec and graph with chosen models, validation, and independent review.
- `create-pr`: concise pull request titles and descriptions.
- `create-ticket`: concise product tickets and bug reports.

The shared installer also includes `effect`, installed directly from
[Kit Langton's skills](https://github.com/kitlangton/skills). Third-party skills
stay in their original repositories so updates come from their authors.

Install the whole collection so references between skills, such as
`refine` → `adhd`, remain available. Skill names stay unchanged across harnesses.

`build` composes the following responsibilities; these are stages it revisits as
needed, not commands you must run manually:

| Supporting skill | Role in build                                                                 |
| ---------------- | ----------------------------------------------------------------------------- |
| `refine`         | Settle feature direction and the current slice's consequential decisions.     |
| `spec`           | Preserve the implementation agreement and verifiable acceptance examples.     |
| `graph`          | Map dependencies, PR boundaries, size estimates, and slice readiness.         |
| `create-ticket`  | Create or update tracking only when you ask to build with tickets.            |
| `execute`        | Implement, validate, independently review, and integrate one slice at a time. |
| `audit`          | Simplify plans and implementation within the agreed scope.                    |
| `create-pr`      | Write and create the smaller PRs and feature PR.                              |
| `summarize`      | Explain completed slices and deliver the mandatory final summary.             |
| `adhd`           | Keep communication readable throughout.                                       |

`summarize` supplies shared design guidance during planning and implementation, then
provides a mandatory detailed written summary of the completed change in the
final response from `build` or `execute`. It also works directly on an
existing PR. Summaries explain behavior, components, interfaces, public APIs,
data structures, decisions, and validation where relevant. `audit` simplifies
plans and code; `execute` retains independent correctness review and uses `create-pr` for concise PR descriptions. `adhd` applies
throughout.

## Slice-based workflow

Map the overall feature direction, shared contracts, and likely PR boundaries.
Fully refine and specify one slice at a time, then implement, validate, review,
integrate, and summarize it before detailing the next. A slice can complete one
layer or a narrow end-to-end behavior; each has a bounded, verifiable outcome.
Parallel implementation is opt-in.

`graph` estimates each PR's added plus deleted lines, including tests and
migrations: target roughly 300–500, aim below 600, and agree on exceptions above
700 before proceeding. Generated files and lockfile churn are reported separately
alongside the total. Check actual sizes during execution and use them to update
later estimates. Aggregate feature PRs follow the same sizing rule.

## Installation

Use Node.js and the [skills CLI](https://github.com/vercel-labs/skills) to install
the shared selection. From a Nopeus checkout, run:

```sh
bash packages/nopeus-skills/install.sh --global
```

The script installs Nopeus skills from `dev` and Effect from its upstream
repository. Run it on each machine to install the same selection. Each source
tracks its latest version, so installations at different times may differ.

Choose your agents in the installer, or pass options such as
`--agent claude-code cursor --yes`. Options apply to both sources. Omit
`--global` to install into the current project; you can invoke the script by its
absolute path from another project.

Without a checkout, run the same installation commands directly:

```sh
npx skills add https://github.com/adamaho/nopeus/tree/dev/packages/nopeus-skills --skill '*' --global
npx skills add kitlangton/skills --skill effect --global
```

To install from a local checkout, run this from the Nopeus repository root:

```sh
npx skills add ./packages/nopeus-skills --skill '*'
```

This local command installs only Nopeus's own skills. Rerun it after local edits.

To preview the complete selection, including upstream Effect, use the shared
installer with a local source override:

```sh
NOPEUS_SKILLS_SOURCE="$PWD/packages/nopeus-skills" \
  bash packages/nopeus-skills/install.sh --global --agent codex claude-code cursor --yes
```

The override affects only Nopeus's own skills; third-party sources remain
unchanged. Normal installations continue to use the `dev` branch.

## Updates

Rerun the shared installer to apply the current selection, including newly
added skills. To refresh all globally installed skills from their recorded
sources, run:

```sh
npx skills update --global
```

For project installations, use `npx skills update --project`. Effect updates
come directly from Kit's repository and do not require a Nopeus PR.

If Effect was previously installed from Nopeus, rerun the upstream install
command once and accept replacing the existing skill. This records Kit's
repository as its update source:

```sh
npx skills add kitlangton/skills --skill effect --global
```

Use the same scope and agents as the existing installation.

Nopeus's own skills use the package's MIT license. Third-party skills retain
their upstream licenses. App-synced caches remain machine-local and are excluded
from this collection.

Changesets are not needed for this private workspace package.
