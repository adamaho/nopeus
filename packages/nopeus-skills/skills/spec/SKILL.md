---
name: spec
description: >-
  Turn software ideas into feature specifications through refinement and codebase
  exploration. Use when asked to draft, create, or refine a spec for later slicing
  into small, testable pieces of work.
---

# Spec

Read and apply [refine](../refine/SKILL.md), including its communication guidance.

Create a spec that the slice skill can use without guessing at product decisions.
Settle behavior and technical boundaries; leave routine coding choices to
implementation. The slice skill decides how to divide and order the work.

The spec is a disposable plan for upcoming work. Code is the source of truth for
implemented behavior; do not maintain completed specs as permanent documentation.

## Draft And Refine

Start from the user's idea, existing draft, or agreed refinement decisions.
Explore the relevant code and repository conventions before describing the
current system. Reuse settled decisions instead of asking the user again.

Draft what is known, marking unresolved decisions as open questions. Apply refine
to resolve them one at a time, then update the draft with each answer. Keep
proposed behavior distinct from facts verified in the code.

## Spec Contents

Keep the spec concise and proportional to the feature. Cover:

- **Purpose:** who needs the feature, their problem, and the desired outcome.
- **Behavior:** user actions and observable results, including relevant failures,
  permissions, and edge cases.
- **Acceptance examples:** concrete starting conditions, actions, and expected
  results that show when the feature works.
- **Scope:** what is included, excluded, or explicitly deferred by the user.
- **Technical context:** relevant code locations, existing capabilities, shared
  interfaces, data ownership, and constraints that affect the work.
- **Dependencies:** external prerequisites and shared decisions or contracts that
  affect sequencing or whether work can proceed independently.

Give each acceptance example a stable label so slices can refer back to it.
Include only technical detail needed to preserve behavior, expose dependencies,
or respect constraints. Identify shared interface inputs, outputs, and failure
behavior when separate pieces of work will need to agree on them.

Describe complete outcomes across the affected parts of the system. For example,
an invitation spec covers sending an invitation and showing it as pending,
including permissions and delivery failures. Avoid organizing requirements as
separate database, backend, and UI task lists.

## Ready For Slicing

Check whether another agent can identify small, independently testable outcomes,
trace them to acceptance examples, and see which shared contracts or prerequisites
could block parallel work. Record actual dependencies, not a proposed task order.

Resolve questions that could change behavior, scope, acceptance, or dependencies
before declaring the spec ready. Keep user-approved exclusions and deferrals
explicit. If a deferred decision still blocks slicing, mark the spec as a draft
and explain the blocker.

## Delivery

Keep specs outside versioned documentation. Use the user's requested location or
the repository's disposable workspace convention. Otherwise, save to
`.scratch/specs/<feature>.md` and ensure the directory is ignored by Git before
writing. Update an existing spec in place when the request is a revision.

Return the spec link and a brief readiness status. Keep chat-specific permissions
out of the spec. Creating a spec does not itself start slicing, create tickets,
or implement the feature.
