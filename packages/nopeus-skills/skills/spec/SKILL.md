---
name: spec
description: >-
  Create or revise disposable feature specs ready for slicing into small,
  testable pieces of work. Use with an idea, existing draft, or agreed decisions.
---

# Spec

Write a disposable plan for upcoming work. Code remains the source of truth for
implemented behavior. Settle behavior and technical boundaries so the slice skill
can divide the work; leave routine coding choices to implementation.

## Write The Spec

- Inspect relevant code and repository conventions. Distinguish verified facts
  from proposed behavior.
- When enough information is available, write the spec directly. Reuse settled
  decisions without another refinement pass.
- Mark missing decisions as open questions and suggest using
  [refine](../refine/SKILL.md) to resolve them. Keep the spec as a draft until
  those decisions are settled; do not assume answers or start refinement
  automatically.
- Update the draft as decisions are resolved.

## Spec Contents

Use plain language and short sections, proportional to the feature:

- **Purpose:** users, problem, and desired outcome.
- **Behavior:** actions, results, permissions, failures, and relevant edge cases.
- **Acceptance examples:** starting conditions, actions, and expected results.
- **Scope:** included work and user-approved exclusions or deferrals.
- **Technical context:** relevant code, existing capabilities, data ownership,
  shared interfaces, and constraints.
- **Dependencies:** prerequisites and shared contracts affecting order or parallel
  work. Leave task ordering to the slice skill.

Give acceptance examples stable labels for slices to reference. Define shared
interface inputs, outputs, and failures where separate pieces must agree.
Describe complete outcomes, such as sending an invitation and showing it as
pending, rather than separate database, backend, and UI task lists.

## Ready For Slicing

Another agent must be able to identify small, testable outcomes, trace them to
acceptance examples, and see dependencies that limit parallel work.

Resolve decisions affecting behavior, scope, acceptance, or dependencies before
marking the spec ready. A deferred decision that blocks slicing keeps it a draft;
explain the blocker.

## Delivery

Use the requested location or repository scratch convention. Otherwise, save to
`.scratch/specs/<feature>.md`, ensuring Git ignores the directory before writing.
Revise existing specs in place. Do not maintain completed specs as permanent docs.

Return the spec link and a brief readiness status. Keep chat-specific permissions
out of the spec. Creating a spec does not itself start slicing, create tickets,
or implement the feature.
