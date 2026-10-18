---
name: spec
description: >-
  Create or revise disposable specs for planned software changes, ready for
  slicing into small, testable pieces of work. Use with an idea, existing draft,
  or agreed decisions.
---

# Spec

Read and apply [adhd](../adhd/SKILL.md) to the spec itself and chat responses.

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

Use this as a coverage checklist, not a required outline. Combine related topics
and omit irrelevant sections:

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

## Keep It Readable

- Open with a short explanation of what will change and why it matters.
- State each requirement once. Reference acceptance labels instead of repeating
  behavior in architecture, contracts, and validation sections.
- Use short bullets for distinct requirements and compact tables when they help
  compare contracts or acceptance examples. Avoid nested lists and dense prose.
- Link existing code and conventions instead of restating them. Keep proposed
  behavior, agreed decisions, and implementation-critical details in the spec.
- Include rationale only when it explains a tradeoff or constraint. Omit exploration
  history, rejected options, and routine implementation instructions unless needed.
- Scale detail to the change. Preserve exact contracts, failure behavior, and
  acceptance criteria where needed; do not trade clarity for a word limit.

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

Then apply `adhd` again to the finished spec: remove repetition and simplify wording
while preserving every decision and criterion needed to implement and verify it.

## Delivery

Use the requested location or repository scratch convention. Otherwise, save to
`.scratch/specs/<change>.md`, ensuring Git ignores the directory before writing.
Revise existing specs in place. Do not maintain completed specs as permanent docs.

Return the spec link and a brief readiness status. Keep chat-specific permissions
out of the spec. Creating a spec does not itself start slicing, create tickets,
or implement the change.
