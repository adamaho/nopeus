---
name: audit
description: >-
  Audit specs and code changes for unnecessary complexity, excess scope, and
  redundant tests. Use when asked to simplify work or during spec and execute.
---

# Audit

Find the simplest solution that meets the agreed requirements. Apply
[adhd](../adhd/SKILL.md) to findings and summaries.

## Stay In Scope

Read the agreed scope, spec or diff, existing patterns, and tests. Edit only the
assigned work. For specs, simplify the plan. In review-only roles, report findings
for the implementer to fix and the reviewer to verify.

Apply clear simplifications directly. Preserve agreed behavior, architecture, and
contracts. Use [refine](../refine/SKILL.md) when a finding raises an unresolved
decision about behavior, scope, architecture, or contracts, or would change an
agreed decision.

## Simplify The Solution

- Require a current need for each new abstraction, dependency, option, or fallback.
- Reuse existing capabilities and conventions.
- Remove wrappers, speculative flexibility, and extra scope that add no needed
  behavior or useful boundary.
- Prefer readable code. Keep complexity that protects contracts, permissions,
  realistic failures, or data integrity; fewer lines alone are not the goal.

## Check Data Models

When the change adds or alters models:

- Keep entities, fields, and relationships tied to current requirements.
- Avoid storing duplicate or easily derived data unless a concrete need justifies it.
- Use explicit states for lifecycle or status values. Represent mutually exclusive
  states as `state: "playing" | "paused"`, not separate `isPlaying` and `isPaused`
  booleans. Keep booleans for independent yes/no facts.
- Use types and constraints to prevent invalid combinations and transitions.
- Check compatibility with existing data and consumers, including migration and
  rollback needs.

## Trim Redundant Tests

Before adding or keeping a test in the change:

1. Search across the codebase, including other packages and integration or
   end-to-end tests, for coverage of the same behavior.
2. Read setup, assertions, and exercised paths. Similar results can protect
   different boundaries or failures.
3. Identify a meaningful coverage gap. Reuse or extend an existing test when clear.
4. Remove tests introduced by the change that add no distinct protection or
   merely mirror private implementation.

For each removal, cite remaining coverage or explain why the test protects no
meaningful behavior. Preserve distinct failure coverage and required checks.
Do not weaken assertions, test every helper by default, or clean up unrelated tests.

## Verify And Stop

Check that plan edits preserve agreed outcomes and acceptance criteria. After code
or test edits, run affected checks and required validation. Reuse valid results
for unchanged inputs; repeat checks only for changes, failures, or unresolved
concerns. Distinguish planned checks from passed checks.

Stop when findings are resolved or explained with evidence. If evidence is missing,
report the gap; do not remove protection on a guess or invent more work.

Briefly report simplifications, coverage reused or removed, and decisions needed.
Link evidence when useful. If no change is needed, say so.
