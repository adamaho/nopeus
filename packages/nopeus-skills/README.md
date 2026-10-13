# Nopeus skills

The canonical collection of Adam's shared agent skills, packaged as
`@adamaho/nopeus-skills`. Each skill uses the portable `SKILL.md` format.

## Skills

- `adhd`: clear, concise communication on any topic.
- `refine`: explore software ideas and resolve decisions with the human.
- `create-pr` and `create-ticket`: concise pull requests and product tickets.
- `effect`: Effect guidance from Kit Langton.

Install the whole collection so references between skills, such as
`refine` → `adhd`, remain available. Skill names stay unchanged across harnesses.

## Disabled skills

`pid` and `pid-ui-sensors` are retained under `disabled/` for future work.
Their entrypoints are named `SKILL.md.disabled` so skill discovery does not load
them. They are excluded from the npm package and Winston's installed skills.
To re-enable one, move it back under `skills/` and restore its `SKILL.md` filename.

## Installation

Winston installs a pinned Nopeus Git revision into the machine's shared agent
skill directory and connects Claude and Cursor to that directory. Skills are
maintained here; Winston owns machine setup and the installed revision.

The npm package contains the same `skills/` tree, references, and licenses.
Installing the npm package alone does not register skills with an agent. Link
its skill directories into your harness's skill directory, or use a skill
installer that accepts this package directory as a local source.

For local development, Winston accepts the package directory directly:

```sh
python3 scripts/install-skills.py --source ../nopeus/packages/nopeus-skills
```

Run this command from the Winston repository. It installs a snapshot; rerun it
after editing the skills.

## Upstream updates

`upstream-lock.json` records the source, exact commit, and original Git tree of
each vendored skill. Review updates in a Nopeus PR, update the lock entry, and
preserve the upstream license. The licenses live inside their skill folders so
they travel with individual installations. Local edits must be described in the
lock entry; the upstream tree identifies the original source, not local edits.

Your own skills use the package's MIT license. Third-party skills retain their
original copyright notices. App-synced caches and licensed ui.sh content are
machine-local and excluded from this public package.

Add a Changeset when changing the published collection. Nopeus's existing
release workflow versions and publishes the package.
