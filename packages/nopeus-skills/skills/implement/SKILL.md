---
name: implement
description: >-
  Coordinate a software change from idea through agreed intent, a task graph,
  parallel implementation, and human-approved trunk integration. Use for the
  full workflow. Use orchestrate for a ready graph, or individual skills for
  focused planning, summaries, ticket, and PR requests.
---

# Implement

Lead one conversation from an idea to a validated outcome on trunk. Connect the
focused skills without requiring the user to invoke each stage separately.
Apply [adhd](../adhd/SKILL.md) throughout.

## Scope and permissions

An end-to-end request authorizes planning in context, isolated implementation,
local commits, validation, independent agent review, and progress updates within
agreed scope. Obtain explicit human approval of each concrete change before it
integrates into trunk. Agreement on a plan does not authorize future integrations.
Deployment and release are outside scope.

Do not create planning files, feature branches, tickets, or PRs by default. Tickets
and PRs are optional, requested integrations, not stages required to proceed.
Respect repository protections, permissions, unrelated work, and explicit user
limits. Reading or discussing this skill does not start implementation. A request
for an individual skill stays within that scope unless the user asks to continue.

## Choose the starting stage

Inspect available conversation context and relevant repository state. Reuse
settled intent, graph tasks, decisions, and existing work; verify progress before
starting at the earliest incomplete stage. Use existing specs, tickets, or PRs
when supplied, without requiring or recreating them.

Keep the lead agent as the orchestrator across stages. Skill transitions do not
require separate lead agents or restarting the conversation.

## Choose models

Use the shared [model selection rules](../orchestrate/references/models.md).
Reuse choices already supplied; ask for missing orchestrator, worker, and reviewer
choices together. Verify tool and model availability. Pass assignments and agreed
permissions to `orchestrate` without asking for them again.

## Connect the skills

Read each skill when needed. Continue through authorized stages without asking
the user to invoke the next one. Wait for necessary decisions and per-change
integration approval; continue independent work when another part is blocked.

| Stage | Skill | Result |
| --- | --- | --- |
| Resolve intent | [refine](../refine/SKILL.md), when decisions are missing | Agreed outcome, scope, behavior, and constraints. |
| Clarify contracts | [spec](../spec/SKILL.md), when useful | Concise architecture, public contracts, and acceptance examples in context. |
| Plan tasks | [graph](../graph/SKILL.md) | In-context tasks, dependencies, parallelism constraints, completion requirements, and a flowchart. |
| Coordinate implementation | [orchestrate](../orchestrate/SKILL.md) | Parallel workers, validation, independent review, and human-approved task integration into trunk. |
| Explain changes | [summarize](../summarize/SKILL.md) | A clear brief for each human approval and a combined outcome summary. |

Use `spec` only to clarify intent that needs more structure; do not rewrite settled
requirements into a mandatory document. Let `graph` use agreed intent directly
when sufficient. Apply `summarize`'s shared design guidance during planning and
implementation and [audit](../audit/SKILL.md) to simplify within agreed scope.

Delegate execution management to `orchestrate`: it schedules all ready independent
tasks within available capacity, supplies complete worker prompts, validates and
independently reviews changes, and serializes approved integrations. Each task
gets human review before reaching trunk; there is no final feature-branch merge.

Use [create-ticket](../create-ticket/SKILL.md) and
[create-pr](../create-pr/SKILL.md) only when requested. Reuse supplied destinations
and ask for missing destination details only when that integration is needed.
An explicitly requested PR may require a source branch; its use does not remove
the human approval gate.

## Handle changes and interruptions

Keep shared intent, model choices, graph state, assignments, commits, evidence,
approvals, blockers, and next ready work in the orchestrator's context. Do not
persist planning files or introduce a storage system. Use the environment's agent
communication and concise conversation updates.

When discoveries affect agreed behavior, architecture, contracts, or scope, use
`refine` for the needed human decision and block affected work. Update intent and
the graph together. Let `orchestrate` send revised instructions to affected workers,
require reconciliation, and invalidate stale evidence or approval. Continue work
whose assumptions remain valid.

On interruption, explain the current state and resume point in the conversation.
On resume, verify actual repository, worker, and review state against available
context. Recover missing intent or approval evidence rather than guessing or
assuming the previous context survived. Keep incomplete stages open.

## Hand off to the human

Ensure `orchestrate` delivers `summarize`'s written brief for each proposed task
change before seeking integration approval. Independent correctness review and a
summary do not themselves grant human approval.

Use `summarize` for the combined outcome at the end of work. Explain what changed,
how the pieces fit, consequential decisions, acceptance coverage, exact validated
and integrated revisions, independent review results, and remaining limitations.
Distinguish integrated work from blocked, unfinished, or awaiting-review tasks.
Do not imply integration means release.

Make the result understandable without opening code or earlier messages. Reuse
already delivered walkthroughs with a concise recap. Link commits and any requested
PRs or tickets as supporting evidence, not substitutes for explanation. Completion
requires combined outcome evidence, not just completed worker assignments.
