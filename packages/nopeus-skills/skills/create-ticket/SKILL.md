---
name: create-ticket
description: >-
  Write, rewrite, or shorten product ticket and bug report titles and
  descriptions. Use when the user asks to draft a ticket, create an issue,
  define acceptance criteria, or turn feedback into a product ticket or bug
  report. Use concise factual bullets focused on user problems and outcomes,
  or bugs and reproduction steps.
---

# Create Ticket

Write a short, specific title and a description using the appropriate format
below. Product tickets describe a user problem and the outcomes needed to
resolve it. Bug reports describe incorrect behavior and how to reproduce it.

## Writing rules

- Use only the two headings for the selected format, with flat `-` bullets
  beneath each. Keep each bullet to one short, concrete statement or action.
- Include only information needed to understand the issue and the intended
  outcome or reproduction. Use the fewest bullets that preserve those facts.
- Ground current behavior and reproduction steps in the user's report or
  available evidence. Do not invent affected users, frequency, severity,
  environments, root causes, or reproduction details.
- For product work, express acceptance criteria as required future behavior,
  not claims that the behavior already exists. Derive them from the requested
  scope without adding unrequested features or requirements.
- Omit introductions, summaries, filler, user-story boilerplate, implementation
  plans, speculative solutions, validation reports, and agent activity.
- Keep technical details only when necessary to identify the problem or
  reproduce the bug. Prefer user-visible behavior over internal mechanics.
- If essential information is missing, ask a focused question. A draft can
  mark an essential unknown as "Not provided"; never present a guess as fact.
- Follow an explicit request for a different format. Keep mandatory tracker
  fields concise and do not fill optional sections just because they exist.

## Product ticket

Use a title naming the intended user outcome. Include exactly these sections:

```markdown
## User problem

- [Who is affected, what they cannot do, and the concrete impact.]

## Acceptance criteria

- [An observable outcome that must be true when the work is complete.]
```

Each acceptance criterion must be independently checkable. Describe what a
user can do or observe, including relevant conditions supplied in the request.
Avoid vague criteria such as "works correctly" or "improves the experience."
Acceptance criteria are product outcomes, not a list of tests to run or coding
tasks to perform.

Example title: Switch organizations from the account menu

```markdown
## User problem

- Users must sign out and back in to switch organizations, interrupting their work.

## Acceptance criteria

- Users can switch to another organization they belong to from the account menu.
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

Keep steps as ordered-in-sequence bullets, with one action per bullet. Include
only known prerequisites needed to reproduce the issue. Distinguish reported
steps from verified reproduction when it matters; do not claim to have
reproduced a bug without doing so.

Example title: Clearing the search field leaves the results list empty

```markdown
## Bug

- Clearing the search field leaves the results list empty instead of restoring all results.

## Steps to reproduce

- Open a list containing results.
- Search for a term that matches no results.
- Clear the search field.
```

## Delivery

Choose the format based on whether the request describes new product behavior
or a defect in expected behavior. Use the user's classification when supplied.
When that distinction is unclear and would change the ticket, clarify it.

For a writing request, return the title and description without extra
commentary. Create or update a ticket in an external tracker only when the
user authorizes that action, using the requested destination. After publishing,
verify the saved content and return the ticket link with a brief status.
