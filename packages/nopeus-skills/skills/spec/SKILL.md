---
name: spec
description: >-
  Clarify behavior, contracts, and acceptance in conversation context, ready for
  slicing into small, testable pieces of work. Use with an idea, existing draft,
  or agreed decisions.
---

# Spec

Read and apply [adhd](../adhd/SKILL.md) to the spec itself and chat responses.
Use [summarize](../summarize/SKILL.md)'s planning guidance and relevant design references
to make responsibilities, composition, and public interfaces understandable.

Clarify the plan in conversation context without creating or persisting files. Code remains the source of truth for
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

Start with three compact parts; combine or expand them only when the change needs
it. Keep one shared statement of intent in context for the human and agents:

- **Outcome and scope:** who benefits, what changes or stays unchanged, important
  constraints, and agreed exclusions or deferrals.
- **Design and contracts:** the affected responsibilities and data flow, changed
  public interfaces, and consequential decisions. Use a small map, folder tree,
  contract table, or consumer example where useful. Link existing capabilities
  and conventions; describe the change and any agreed exceptions.
- **Acceptance examples:** labeled starting conditions, actions, and observable
  outcomes or measurable targets that slices can reference.

Include the permissions, failure behavior, edge cases, retries, compatibility,
transition, and rollback details needed to implement and verify the change.
Preserve exact inputs and outputs where separate components must agree. Record
prerequisites that constrain slicing; leave task order, dependencies, assignments,
and progress to [graph](../graph/SKILL.md).

Follow the design guidance in `summarize` and existing repository conventions unless
an agreed change requires otherwise. State change-specific decisions once; do
not reproduce the shared architecture guidance as sections of every spec.

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

Return the concise agreed intent and readiness status in the conversation. Do not
create or persist spec files, planning documents, or a separate storage system.
Reuse existing context instead of requiring a standalone spec when the intent is
already precise enough for `graph` to plan tasks. Carry relevant decisions and
acceptance examples into graph context and worker prompts.

Clarifying intent does not itself start implementation, create tickets or PRs,
or authorize trunk integration. Respect requests to stop at planning.
