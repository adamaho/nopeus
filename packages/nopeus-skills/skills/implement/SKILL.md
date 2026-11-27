---
name: implement
description: >-
  Coordinate a software change from idea through agreed intent, a task graph,
  parallel implementation on a feature branch with human approval of each task,
  or unattended to the end on request, and a final PR to trunk. Use for the full workflow. Use orchestrate for a ready graph, or individual skills for
  focused planning, summaries, ticket, and PR requests.
---

# Implement

Lead one conversation from an idea to a validated feature branch with a PR open
against trunk. Connect the
focused skills without requiring the user to invoke each stage separately.
Apply [adhd](../adhd/SKILL.md) throughout.

## Scope and permissions

An end-to-end request authorizes planning in context, a feature branch, isolated
implementation, local commits, validation, independent agent review, progress
updates within agreed scope, and opening the final PR. By default, obtain
explicit human approval of each concrete change before it integrates into the
feature branch; agreement on a plan does not authorize future integrations. When
the human asks to run the graph to the end without them, pass that to
`orchestrate`, which defines the unattended run: tasks still get reviewed and
briefed, and the PR becomes the approval. Merging the PR,
deployment, and release are outside scope.

Do not create planning files or tickets by default. Tickets are an optional,
requested integration, not a stage required to proceed.
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

Load each skill when its stage starts, using the agent's skill tool or by reading
the linked `SKILL.md` when no such tool exists. Do not work from memory of a skill.
Continue through authorized stages without asking the user to invoke the next one.
Wait for necessary decisions and per-change integration approval; continue
independent work when another part is blocked.

| Stage | Skill | Result |
| --- | --- | --- |
| Resolve intent | [refine](../refine/SKILL.md), when decisions are missing | Agreed outcome, scope, behavior, and constraints. |
| Clarify contracts | [spec](../spec/SKILL.md), when useful | Concise architecture, public contracts, and acceptance examples in context. |
| Plan tasks | [graph](../graph/SKILL.md) | In-context tasks, dependencies, parallelism constraints, completion requirements, and a flowchart. |
| Coordinate implementation | [orchestrate](../orchestrate/SKILL.md) | A feature branch, parallel workers, validation, independent review, and human-approved integration of each task into that branch. |
| Check changes | [review](../review/SKILL.md) | A review-and-fix loop on each task, run by `orchestrate`, and a review of the combined feature. |
| Explain changes | [summarize](../summarize/SKILL.md) | A brief for each human approval and one for the combined outcome. |
| Propose the feature | [create-pr](../create-pr/SKILL.md) | One PR from the feature branch to trunk. |

Use `spec` only to clarify intent that needs more structure; do not rewrite settled
requirements into a mandatory document. Let `graph` use agreed intent directly
when sufficient. Load `summarize` and apply its shared design guidance during
planning and implementation, and load [audit](../audit/SKILL.md) to simplify within
agreed scope.

Delegate execution management to `orchestrate`: it schedules all ready independent
tasks within available capacity, supplies complete worker prompts, validates and
runs `review`'s review-and-fix loop on each one, and serializes approved
integrations. Working end to end changes nothing about that loop: every task is
reviewed, fixed by its worker, and reviewed again until it is clean or needs
you. Every graph
runs on one feature branch: each task gets its own brief and human review before
it merges into that branch, and the finished branch goes to trunk through one
PR. By default the PR reviews the whole and does not replace the per-task gate.

Use [create-ticket](../create-ticket/SKILL.md) only when requested. Reuse supplied
destinations and ask for missing destination details only when that integration
is needed.

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

Ensure `orchestrate` delivers `summarize`'s brief for each proposed task
change before seeking integration approval, or builds and keeps it in an
unattended run. Independent correctness review and a summary do not themselves
grant human approval.

Load `summarize` at the end of work and build its final handoff brief for the
combined outcome; it defines the brief, so do not write one from memory. Then
make sure the PR from the feature branch to trunk is open. Do not imply
integration into the feature branch, or an open PR, means the work is merged or
released.

Link the PR and any requested tickets alongside the brief as supporting evidence,
not substitutes for it. Completion requires combined outcome evidence and an open
PR, not just completed worker assignments.
