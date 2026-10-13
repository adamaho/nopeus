# Nopeus skills

The canonical collection of Adam's shared agent skills, organized as the workspace package
`@adamaho/nopeus-skills`. It is public on GitHub and is not published to npm. Each skill uses the portable `SKILL.md` format.

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
them. They are excluded from Winston's installed skills.
To re-enable one, move it back under `skills/` and restore its `SKILL.md` filename.

## Installation

Winston downloads the latest `dev` branch from this repository on every skills
installation. It copies the active `skills/` collection into machine-local
storage and connects the agent harnesses to it. Skills are maintained here;
Winston owns installation and harness setup. No npm release or version pin is
required: merge a skill change into `dev`, then rerun Winston's installer.

The workspace package is marked `private: true` to prevent npm publication.

For local development, Winston accepts the package directory directly:

```sh
node scripts/install-skills.mjs --source ../nopeus/packages/nopeus-skills
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
original copyright notices. App-synced caches remain machine-local and are
excluded from this collection.

Changesets are not needed for this private workspace package.
