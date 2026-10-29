# Nopeus skills

The canonical collection of shared agent skills, organized as the workspace package
`@adamaho/nopeus-skills`. It is public on GitHub and is not published to npm. Each skill uses the portable `SKILL.md` format.

## Skills

- `adhd`: clear, concise communication on any topic.
- `refine`: explore software ideas and resolve decisions with the human.
- `spec`: define behavior, architecture, contracts, and acceptance for software changes.
- `review`: shape concise specs and guide human review of architecture, composition, and public interfaces.
- `audit`: simplify specs and code changes, reusing test coverage and removing redundancy.
- `graph`: plan and maintain implementation dependencies, PR groups, and completion requirements.
- `implement`: take an idea through planning, tickets, coding, and review in one conversation.
- `execute`: carry out a ready spec and graph with chosen models, validation, and independent review.
- `create-pr`: concise pull request titles and descriptions.
- `create-ticket`: concise product tickets and bug reports.

The shared installer also includes `effect`, installed directly from
[Kit Langton's skills](https://github.com/kitlangton/skills). Third-party skills
stay in their original repositories so updates come from their authors.

Install the whole collection so references between skills, such as
`refine` → `adhd`, remain available. Skill names stay unchanged across harnesses.

`implement` coordinates `refine` → `spec` → `graph` → `create-ticket` → `execute`.
`review` supplies shared design guidance during planning and implementation, then
guides the human through the completed change at handoff. It also works directly
on an existing PR. `audit` simplifies plans and code; `execute` retains independent
correctness review and uses `create-pr` for concise PR descriptions. `adhd` applies
throughout.

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
