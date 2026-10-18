---
name: spec
description: >-
  Create or revise disposable specs for planned software changes, ready for
  slicing into small, testable pieces of work. Use with an idea, existing draft,
  or agreed decisions.
---

# Spec

Write a disposable plan for upcoming work. Code remains the source of truth for
implemented behavior. Settle behavior, architecture, and contracts; leave routine
coding choices to implementation.

## Write The Spec

- Inspect relevant code and repository conventions. Distinguish verified facts
  from proposed behavior.
- When enough information is available, write the spec directly. Reuse settled
  decisions without another refinement pass.
- If unanswered questions affect behavior, architecture, contracts, scope,
  acceptance, or dependencies, use [refine](../refine/SKILL.md) in the same
  conversation. Investigate available evidence, then ask numbered questions one
  at a time. Wait for answers; do not invent decisions.
- Keep the spec as a draft during refinement. Update it as decisions are resolved,
  then check readiness again. Do not end with a list of unresolved decisions when
  refinement can resolve them.
- Honor requests to produce only a draft, pause, or defer decisions. If needed
  evidence or access is unavailable, explain the blocker and ask for what is
  needed rather than implying the spec is complete.

## Spec Contents

Use plain language and short sections suited to the change. Include only relevant
details:

- **Purpose:** affected users or systems, problem, and desired outcome.
- **Behavior:** what changes and what must stay unchanged, including permissions,
  failures, and edge cases.
- **Acceptance examples:** starting conditions, actions, and observable results or
  measurable targets.
- **Scope:** included work and user-approved exclusions or deferrals.
- **Technical context:** relevant code, existing capabilities, and constraints.
- **Architecture:** module responsibilities, data ownership, what extends existing
  code or needs a new module or package, dependency direction, and where pieces
  are assembled. Show how requests or data flow between them when useful.
- **Contracts:** shared interface inputs, outputs, permissions, failures, and retry
  behavior that separate pieces must agree on.
- **Dependencies:** prerequisites and shared contracts affecting order or parallel
  work.

Follow existing repository structure and composition patterns unless an agreed
change requires otherwise. Give acceptance examples stable labels for slices to
reference. Describe complete, testable outcomes across the affected components.
Include compatibility, transition, and rollback requirements when relevant.

## Ready For Slicing

Apply [audit](../audit/SKILL.md) before marking the spec ready: simplify the plan
and reuse existing capabilities and test coverage within agreed scope.

Another agent must be able to identify small, testable outcomes, trace them to
acceptance examples, understand how the pieces fit together, and see dependencies
that limit parallel work.

Resolve decisions affecting behavior, architecture, contracts, scope, acceptance,
or dependencies before marking the spec ready. A deferred decision that blocks
slicing keeps it a draft; explain the blocker.

Before delivery, check the spec for unanswered questions and conflicting decisions.
Return to `refine` for any that prevent readiness, unless the user has explicitly
paused or deferred that work. Record approved deferrals and their effect on
readiness; they do not count as resolved decisions.

## Delivery

Use the requested location or repository scratch convention. Otherwise, save to
`.scratch/specs/<change>.md`, ensuring Git ignores the directory before writing.
Revise existing specs in place. Do not maintain completed specs as permanent docs.

Return the spec link and a brief readiness status. Keep chat-specific permissions
out of the spec. Creating a spec does not itself start slicing, create tickets,
or implement the change.
