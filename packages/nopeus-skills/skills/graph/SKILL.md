---
name: graph
description: >-
  Plan and maintain a software change as a graph of tasks with dependencies,
  shared intent, and completion evidence. Use when asked to turn agreed intent
  or an existing spec into work for agents, identify parallel tasks, or update
  a plan after discoveries. This skill plans work; it does not execute it.
---

# Graph

Create a task graph that fresh agents can implement and reviewers can
verify. Plan small changes that integrate directly into trunk after human review.
Tickets, PRs, and a separate spec document are optional.
Apply [adhd](../adhd/SKILL.md) throughout.

## Ground the plan

Read agreed intent, any existing spec, relevant code, and repository instructions.
Identify the actual trunk branch, existing behavior, shared contracts, acceptance
examples, and required checks. Reuse settled decisions and existing tasks.
Use [refine](../refine/SKILL.md) for unanswered questions affecting behavior,
architecture, contracts, or scope. Block affected tasks and dependents until those
decisions are resolved; independent work can remain ready.

## Build the graph in context

Keep the authoritative graph in the orchestrator's working context and present
it in the conversation. Do not create planning files, repository artifacts, or a
separate storage system. No spec document is required; use agreed intent and any
existing context supplied by the user.

Maintain shared intent once: overall outcome, scope, trunk branch, constraints,
contracts, and labeled feature acceptance examples. Break the outcome into small,
independently reviewable tasks. Include the relevant shared intent in each worker
handoff rather than assuming workers inherit the conversation.

For each task, record:

- **ID and outcome:** stable identifier and observable contribution.
- **Scope:** affected components, exclusions, and relevant code references.
- **Context:** task-specific requirements and relevant shared intent and contracts
  sufficient for an agent starting without conversation history.
- **Prerequisites:** task IDs and why each must integrate before this task starts.
- **Coordination:** shared files, schemas, resources, or contracts that constrain
  parallel work, including any required serialization.
- **Acceptance and evidence:** observable outcomes, relevant checks, and the
  feature acceptance examples this task covers.
- **Execution record:** status, worker and checkout when assigned, planning and
  trunk revisions used, blockers, validation and review evidence, human approval,
  and the integrated commit when available.

Keep records proportional to the task; leave unobserved evidence explicitly
pending. The orchestrator owns task status and derives summaries from the graph.

Prepare enough context for `execute` to craft each worker prompt: task ID and
scope, relevant requirements and contracts, integrated prerequisites, acceptance
criteria, required checks, checkout and trunk revision, and reporting expectations.
Include necessary information directly; use code references as supporting evidence,
not as a substitute for instructions. This skill plans handoffs without dispatching
workers.

## Define small trunk changes

Make each implementation task suitable for one final commit on trunk. Include its
relevant tests and documentation. Workers may use any number of checkpoint
commits; execution consolidates them into the proposed task commit before human
review. Split work that cannot be coherently reviewed and integrated this way.

Each integrated change must leave trunk working while the larger feature may be
unfinished. Record compatibility, exposure, migration, and recovery requirements
where relevant. Use feature flags or staged compatible changes when needed.
Do not rely on a feature branch to hide incomplete behavior.

Include feature-level integration and acceptance verification. A verification-only
task need not manufacture a code commit; record its evidence against the revisions
it checked. Later corrections to landed code become new tasks and commits, without
rewriting trunk history.

## Express dependencies and parallelism

Use prerequisite IDs in the graph as the authoritative dependency edges. Remove
cycles by revising task boundaries or resolving contracts. Preserve stable IDs
when splitting or replacing tasks and record the replacement mapping.

A task is ready only when its prerequisites are verified integrated into trunk,
its required decisions are settled, and its resources are available. Written code,
passing checks, or human approval alone do not satisfy an integration dependency.

Plan for all ready, independent tasks to run concurrently. Do not impose an
arbitrary worker limit or serialize unrelated tasks. Execution may launch as many
workers and independent reviewers as useful within available tool, environment,
and user limits. Account for shared resources and semantic conflicts, not just
file overlap; record the reason when work must be sequential.

Require isolated checkouts for parallel workers, such as detached worktrees;
named task branches are not required. The orchestrator owns shared planning
updates and serializes trunk integration. Workers report discoveries instead of
independently changing shared contracts or overwriting graph status.

## Define review and completion gates

Record the planned lifecycle:

`blocked` → `ready` → `implementing` → `validating` → `awaiting-human-review`
→ `approved` → `integrated`

Allow returns to earlier states for repairs or stale evidence. Record the reason
and resume point for blocked work. Verification-only tasks finish as `verified`
after their required checks and review, without pretending code was integrated.

Before each implementation task integrates, require:

- Behavioral evidence and repository checks covering the proposed change.
- Independent agent correctness review, including relevant regressions.
- A human-facing explanation and concrete diff or commit for approval.
- Explicit human approval of that change before it reaches trunk.

Tie approval and evidence to the proposed revision and compared trunk revision.
Before integration, execution reconciles with current trunk and refreshes affected
validation and independent review. Material changes to the reviewed change or its
relevant context require renewed human review. Never treat planning approval as
permission to integrate code, or bypass repository protections.

Mark a task integrated only after verifying the trunk update succeeded. Unblock
its dependents from that evidence. Completed implementation tasks alone do not
prove the feature outcome: require combined acceptance and integration evidence,
independent review, and a human-facing outcome review as the feature comes together.
There is no final feature-branch merge.

## Maintain the plan during implementation

Have workers report discoveries with affected task IDs and supporting evidence.
The orchestrator resolves routine implementation adjustments within agreed scope;
use `refine` and obtain needed human decisions for changes to agreed behavior,
architecture, contracts, or scope before affected work continues.

Update authoritative shared context, affected tasks, dependencies, and acceptance
coverage together. Record what changed and why. Notify active workers of the
changed planning revision and whether to continue, reconcile, or pause. Send
revised task instructions explicitly; updating the orchestrator's context alone
does not update a worker. Require workers to acknowledge and reconcile relevant
updates before integration.

Invalidate affected validation or approval when its basis changes. Reopen
unintegrated tasks as needed; create follow-up tasks for changes to landed work.
On resume, reconcile available conversation context with actual checkout, trunk,
and review evidence. If intent, dependencies, or approval evidence is missing,
recover it or ask for what is needed before affected work continues; do not assume
context survived or invent prior approval. Keep unaffected work progressing.

## Visualize and deliver

Present a flowchart in the conversation, showing stable task IDs, short outcomes,
prerequisite-to-dependent arrows, and the overall feature outcome. Explain arrow
direction. Use Mermaid where supported; split large graphs into an overview and
detail charts. Derive the chart from task dependencies rather than making
it a second authority. Check acceptance coverage, including combined behavior.

Create tickets only when requested, using [create-ticket](../create-ticket/SKILL.md)
to publish the requested graph context. PRs are also created only on request through
[create-pr](../create-pr/SKILL.md); an explicitly requested PR may require a source
branch. Neither integration is a prerequisite for planning or execution.

Return the graph, ready work, parallelism constraints, and unresolved blockers
in the conversation. This skill prepares tasks and execution requirements;
it does not launch workers, implement tasks, perform reviews, create tickets or
PRs, or integrate changes into trunk.
