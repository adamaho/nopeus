---
name: create-pr
description: >-
  Create GitHub pull requests and write or shorten PR titles and descriptions.
  Use when the user asks to open a PR, prepare a PR description, or rewrite an
  existing PR description. Keep descriptions to brief factual bullets about
  what changed.
---

# Create PR

Write a concise title and a short bullet list of the actual changes in the PR.

## Description style

- Use only flat `-` bullets, usually 1–5. Use fewer when sufficient; group
  related changes instead of listing every file or commit.
- Keep each bullet to one short sentence stating what was added, changed,
  fixed, or removed. Start with a concrete verb such as Add, Fix, or Remove.
- Describe the final diff as a whole. Include only facts supported by it.
- Omit headings, introductions, conclusions, nested lists, and long explanations.
- Omit validation commands, test results, test plans, checklists, screenshots,
  implementation walkthroughs, agent activity, and conversational history.
- Changes to tests are changes in the PR and may warrant a bullet. Running
  tests is validation activity and does not belong in the description.
- State any breaking change briefly as a change, without adding a separate
  essay or rollout plan.
- Do not pad the description with minor incidental edits or repeat the title
  merely to fill space.

Example body:

```markdown
- Add organization switching to the account menu.
- Fix session persistence after switching organizations.
- Remove the legacy organization selector.
```

Use this style even when an optional PR template suggests extra sections.
Follow an explicit user request for a different format; keep any mandatory
repository fields as brief as possible.

## Workflow

1. Inspect the repository instructions, current branch, working-tree status,
   remotes, intended base, and any existing PR for this branch. Read the full
   branch diff against its base and the relevant commits, not just the latest
   commit or filenames. For stacked branches, summarize only this PR's diff
   against its parent branch.
2. Write a short title describing the primary change. Follow the repository's
   PR title conventions, including scoped Conventional Commits where required.
3. Write the body using the rules above. Summarize only changes included in the
   PR; uncommitted work is not part of the branch diff. Commit work only within
   the user's authorized scope, using the repository's commit workflow.
4. If asked only to draft or rewrite text, return the proposed title and body.
   Create or edit a remote PR only when the user's request authorizes it.
5. When asked to create a PR, push the intended branch if needed and create it
   with an explicit base, head, title, and body. Respect requested draft status.
   If a matching PR already exists, use it instead of creating a duplicate;
   edit its title or body when requested. Do not merge the PR.
6. Pass multiline text through a structured tool argument or write it to a
   temporary file and use `gh pr create --body-file` or `gh pr edit --body-file`.
   Do not rely on auto-generated bodies or commit-message dumps. After an
   uncertain creation result, check for an existing PR before retrying.
7. Verify the saved title, body, and target branches. Return the PR link with a
   brief status. If creation or pushing fails, report the blocker; do not
   force-push or change branch history as an automatic recovery step.

This skill controls PR writing, not whether required repository checks run.
Keep validation reporting out of the PR body.
