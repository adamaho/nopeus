---
name: slice
description: >-
  Turn a software change spec into thin, end-to-end tickets with dependencies,
  parallel work, and merge criteria. Use when asked to slice a spec or plan
  independently mergeable increments.
---

# Slice

Apply [adhd](../adhd/SKILL.md) to keep tickets concise and easy to scan.

Every ticket describes a small, complete outcome that can merge into the target
branch while the system keeps working. Each merge must stand on its own after
its stated prerequisites; a later ticket must never be needed to repair it.

## Read The Handoff

- Read the spec and relevant code. Confirm the target branch, existing behavior,
  architecture, contracts, acceptance examples, and repository checks.
- Reuse agreed decisions. If missing or conflicting decisions prevent slicing,
  name the blockers and suggest [refine](../refine/SKILL.md). Do not invent answers
  or start refinement automatically.
- A ready label is not enough: verify the handoff still matches the code.

## Find Thin Outcomes

- Split by observable outcomes, not database, API, UI, or testing layers. Include
  all affected layers and their verification in each ticket.
- Start with the smallest complete path, then add another case or capability.
  Fold necessary setup into the first outcome that uses it.
- For internal changes, follow a complete execution or operational path. Do not
  invent a UI or user story for a refactor, migration, or infrastructure change.
- Give each ticket a stable ID and map it to the spec's acceptance examples.
  If an example spans slices, state each contribution and which slice completes it.
- Keep each ticket to one mergeable increment. Do not split it into layer-only
  PRs later. If no safe split exists, keep the outcome together and explain why.

## Keep Every Merge Working

For each ticket, define evidence required before merge:

- The increment builds, passes required checks, and works end to end against the
  target branch plus its already-merged prerequisites.
- Existing supported behavior remains intact, including relevant permissions,
  failure cases, and data integrity. Include regression checks for affected paths.
- API, data, and deployment changes remain compatible with versions that may
  coexist. Stage migrations so existing readers and writers keep working.
- State how to disable or revert the change, or recover forward when rollback
  cannot safely restore data. Identify any required operational prerequisites.

Flags may hide incomplete exposure, but the enabled slice must still work end to
end. State the flag, default, exposure conditions, and checks for both states.
The disabled state must preserve existing behavior; hidden UI alone must not
leave incomplete backend behavior exposed. Plan activation and flag cleanup.
Disabling a flag does not undo data changes.

Treat merge readiness as a gate backed by evidence, not a guarantee of zero risk.
During planning, list required checks; do not claim they have already passed.

## Dependencies And Parallel Work

Record prerequisite ticket IDs and why each is needed. Distinguish work that can
start against agreed contracts from work that can merge independently. Account
for shared files, schema changes, and integration work when proposing parallel
assignments. Remove cycles by changing slice boundaries or resolving contracts.

## Draft The Tickets

Use [create-ticket](../create-ticket/SKILL.md) with spec-based descriptions.
Include enough context to work after the disposable spec is removed:

- **ID and title:** the outcome delivered by this increment.
- **Outcome and scope:** what works after merge, affected components, and exclusions.
- **Acceptance:** observable results and the spec acceptance IDs they cover.
- **Dependencies:** prerequisite IDs and shared contracts.
- **Merge checks:** end-to-end and regression evidence required for this increment.
- **Exposure and recovery:** flags, compatibility, rollout, and recovery as relevant.

Finish with a dependency order and parallel groups. Check that every in-scope
acceptance example is covered, every ticket delivers a complete outcome, and
every allowed merge order preserves a working system. Mark blocked tickets and
their dependents explicitly; do not call them ready.

## Delivery

Return draft tickets and the dependency summary. If saving locally, use the
requested location or repository scratch convention; default to gitignored
`.scratch/slices/<change>.md`. Specs and tickets describe upcoming work; code
remains the source of truth for implemented behavior.

Publish tickets only when requested, using the specified tracker. Creating a
slice plan does not itself authorize implementation, merges, or flag activation.
