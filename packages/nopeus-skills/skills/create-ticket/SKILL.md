---
name: create-ticket
description: >-
  Write, rewrite, or shorten titles and descriptions for user stories, bugs,
  and technical tasks. Use when the user asks to draft a ticket,
  create an issue, define acceptance criteria, or turn feedback into a ticket.
  Default to concise factual bullets; preserve supplied specs and use the spec
  skill when a new spec is requested.
---

# Create Ticket

Write a short, specific title. Choose the ticket type, then the description format.

## Choose the type and format

- **User story:** a factual gap in the user's journey and the required outcomes,
  without prescribing a solution.
- **Bug:** incorrect behavior and how to reproduce it.
- **Technical task:** maintenance or internal changes, such as refactoring,
  dependency upgrades, migrations, or infrastructure work.

Use the user's ticket type when supplied. Otherwise, choose from the request.
Ask only if the distinction would change the ticket.

- Default to the short formats below.
- Use a full spec for any ticket type when supplied or requested, not merely
  because the work is complex.
- Follow explicit requests for other formats.

## Spec-based descriptions

- **Existing spec:** preserve its structure, agreed scope, and decisions. Keep
  necessary detail, including architecture, contracts, dependencies, and
  acceptance examples. Short-format restrictions do not apply.
- **New spec requested:** use [spec](../spec/SKILL.md) to write it, then return
  here for ticket delivery.
- **Unresolved decisions:** name them and keep the spec as a draft until resolved.

## Writing rules

- Ground current behavior and reproduction steps in the user's report or
  available evidence. Do not invent affected users, frequency, severity,
  environments, root causes, or reproduction details.
- Write acceptance criteria as required future outcomes. Stay within the
  requested scope; do not add features or requirements.
- If essential information is missing, ask a focused question. A draft can
  mark an essential unknown as "Not provided"; never present a guess as fact.
- If missing details need decisions about scope, behavior, or outcomes, suggest
  [refine](../refine/SKILL.md) to work through them. Keep the ticket as a draft
  until those decisions are settled; do not start refinement automatically.
- Keep required tracker fields concise. Fill optional sections only when useful.

## Short-format rules

- Use the selected format's two headings with flat `-` bullets. Each bullet
  should contain one short, concrete statement or action.
- Use the fewest bullets needed to explain the work and its outcome,
  or reproduction steps.
- Omit introductions, summaries, filler, implementation
  plans, speculative solutions, validation reports, and agent activity.
- **Stories and bugs:** focus on user-visible behavior. Keep technical details
  needed to identify or reproduce the problem.
- **Technical tasks:** keep technical context needed to
  understand the work and verify its outcome.

## User story

Use a title stating the user's needed capability: "As a [user or role], I should
be able to [desired outcome]." Use a specific role when supported by the request.
Describe what the user needs to accomplish without choosing a UI or technical
solution. Explain the current gap and its impact in the description.

Keep user stories focused on problem facts and required acceptance criteria.
Do not encode design or implementation decisions in the title or description,
including UI placement, controls, or technical approaches.

For the short format, include exactly these sections:

```markdown
## User problem

- [Who is affected, what they cannot do, and the concrete impact.]

## Acceptance criteria

- [An observable outcome that must be true when the work is complete.]
```

Make each criterion independently checkable: what can the user do or observe,
and under which supplied conditions? State the outcome needed to close the gap
without choosing how to achieve it. Do not turn criteria into design decisions,
coding tasks, or tests to run. Avoid vague wording such as "works correctly."

Example title: As a user, I should be able to switch organizations

```markdown
## User problem

- Users must sign out and back in to switch organizations, interrupting their work.

## Acceptance criteria

- Users can move between organizations they belong to without signing out.
- Switching organizations shows the selected organization's data.
```

## Bug report

Use a title naming the observed failure. Include exactly these sections; do not
add a user story or acceptance criteria by default:

```markdown
## Bug

- [Actual behavior and the expected behavior it violates.]

## Steps to reproduce

- [Necessary starting condition.]
- [Action, in execution order.]
- [Action that exposes the reported failure.]
```

List steps in execution order, with one action per bullet and only known,
necessary prerequisites. Distinguish reported steps from verified reproduction
when it matters. Claim reproduction only if you performed it.

Example title: Clearing the search field leaves the results list empty

```markdown
## Bug

- Clearing the search field leaves the results list empty instead of restoring all results.

## Steps to reproduce

- Open a list containing results.
- Search for a term that matches no results.
- Clear the search field.
```

## Technical task

Use a title naming the intended technical outcome. Include exactly these sections:

```markdown
## Purpose

- [What needs to change and why it matters.]

## Acceptance criteria

- [An independently checkable technical outcome required for completion.]
```

Describe observable system behavior or state and any supplied constraints.
Do not invent a user-facing problem or turn criteria into a coding checklist.

## Delivery

Before returning or publishing the ticket, apply [adhd](../adhd/SKILL.md) to
polish the title and description for clear wording, correct grammar, and easy
scanning. Preserve the selected format and necessary detail, including spec
content.

- **Writing request:** return the title and description without extra commentary.
- **Publishing request:** create or update the ticket only when authorized, at
  the requested destination. Verify the saved content and return the link with
  a brief status.
