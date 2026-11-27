# Nopeus skills

The canonical collection of shared agent skills, organized as the workspace package
`@adamaho/nopeus-skills`. It is public on GitHub and is not published to npm. Each skill uses the portable `SKILL.md` format.

## Skills

- `adhd`: clear, concise communication on any topic.
- `refine`: explore software ideas and resolve decisions with the human.
- `spec`: clarify behavior, architecture, contracts, and acceptance in conversation context.
- `summarize`: brief the human on each code change in one fixed format, as markdown or an HTML page on request, and guide design in specs.
- `review`: critically review a code change for missed requirements, bugs, security holes, and unclear code, and report findings, or run a review-and-fix loop when asked.
- `audit`: simplify specs and code changes, reusing test coverage and removing redundancy.
- `graph`: maintain tasks, dependencies, parallelism constraints, and completion evidence in context.
- `implement`: take an idea through planning, human-approved tasks on a feature branch, and a PR to trunk in one conversation.
- `orchestrate`: coordinate parallel graph tasks on a feature branch, with validation, independent review, and human approval before each task merges, then open one PR.
- `create-pr`: concise pull request titles and descriptions.
- `create-ticket`: concise product tickets and bug reports.

The shared installer also includes `effect`, installed directly from
[Kit Langton's skills](https://github.com/kitlangton/skills). Third-party skills
stay in their original repositories so updates come from their authors.

Install the whole collection so references between skills, such as
`refine` → `adhd`, remain available. Skill names stay unchanged across harnesses.

`implement` resolves intent with `refine` and, when useful, `spec`, then uses
`graph` and `orchestrate` to plan and coordinate the work. Planning stays in
conversation context; workers receive complete task prompts. No planning files
are persisted. Ready independent tasks run in parallel within available capacity.

`summarize` supplies shared design guidance, builds a brief for each proposed
task change before human approval, and builds one for the combined outcome. A
bundled Node script renders every brief from Git and a small data file, so the
layout and the numbers never vary. `audit` simplifies
plans and code. `review` is the independent check on each task: its reviewers never edit the
change, and its loop sends findings to the task's worker until the task is
clean. Every graph runs on one
feature branch: `orchestrate` requires that review and, unless you ask it to run
unattended, explicit human approval before integrating
each task as one commit on that branch, then opens one PR from the branch to
trunk. Workers may make any number of checkpoint commits. Tickets are created
only when requested. `adhd` applies throughout.

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
