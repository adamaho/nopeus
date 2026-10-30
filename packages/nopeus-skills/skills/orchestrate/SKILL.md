---
name: orchestrate
description: >-
  Execute or resume a ready task graph using parallel workers, validation,
  independent review, and human approval before each change integrates into
  trunk. Use implement to start from an idea. Tickets, PRs, and planning files
  are not required.
---

# Orchestrate

Carry out the agreed graph through small, validated changes to trunk. Work through
all ready tasks unless the user limits scope, and obtain explicit human approval
before integrating each implementation task. Apply [adhd](../adhd/SKILL.md)
throughout.

## Scope and permissions

An execution request authorizes implementation in isolated checkouts, local
commits, validation, independent review, and in-context graph updates within the
agreed scope. It does not authorize integrating unreviewed changes into trunk.
Human approval applies to the concrete change presented, not all future tasks.

Do not create feature branches, tickets, or PRs by default. Use
[create-ticket](../create-ticket/SKILL.md) or [create-pr](../create-pr/SKILL.md)
only when requested; an explicitly requested PR may require a source branch.
Respect repository protections, user limits, and unrelated work. Deployment and
release are outside scope. Reading or discussing this skill does not start work.

## Check the handoff

Read the agreed intent and [graph](../graph/SKILL.md) in available conversation
context, repository instructions, and relevant code. Identify the trunk branch,
task IDs, prerequisites, shared contracts, acceptance examples, required checks,
and any existing implementation or approval evidence. A separate spec document
is not required.

Use [summarize](../summarize/SKILL.md)'s shared design guidance and relevant references
for implementation and human walkthroughs. If the graph lacks a consequential
decision, return the gap to `implement` when called by that workflow; when called
directly, explain the gap and use the relevant planning skill within authorized
scope. Block only affected work rather than inventing requirements.

Before starting or resuming, inspect actual checkouts, trunk, commits, validation,
and reviews; inspect PRs only when part of the requested workflow. Reconcile the
graph with evidence and reuse existing work. If context or approval evidence is
missing, recover it or ask for what is needed before affected work continues.
Never assume that prior intent or approval survived a session boundary.

## Confirm model assignments

Read [model selection](references/models.md). Reuse existing orchestrator, worker,
and reviewer choices. Ask for missing choices together, verify availability, and
do not silently substitute models. Independent review requires a separate agent
session or review service that did not implement the change.

## Coordinate all ready work

Keep the authoritative graph, assignments, evidence, and decisions in the
orchestrator's working context. Do not create or persist graph files, planning
documents, or a separate storage system. Present progress and the updated graph
in the conversation. Use the environment's existing agent communication.

Continuously select ready tasks: prerequisites are verified integrated into
trunk, necessary decisions are settled, and required resources are available.
Launch workers for all ready, independent tasks up to available tool, environment,
and user limits. Do not impose an arbitrary agent count or process unrelated
tasks sequentially. Refill available capacity as workers finish or tasks unblock.
Use separate reviewers as needed within the same capacity limits.

Use isolated checkouts, such as detached worktrees or isolated agent environments.
Named task branches are not required. Account for shared resources and semantic
conflicts; serialize tasks when their interference requires it and explain why.
If parallel execution is unavailable, proceed sequentially while preserving
selected model assignments and independent review requirements.

Construct a complete prompt for each worker, including:

- Task ID, outcome, scope, exclusions, and the current planning revision.
- Relevant shared intent, exact contracts, settled decisions, and integrated
  prerequisites; do not assume the worker inherits conversation context.
- Acceptance examples, required checks, and relevant design guidance.
- Assigned checkout, trunk revision, and relevant code references.
- [audit](../audit/SKILL.md) guidance for simplicity and useful test coverage.
- Instructions to report changes, commits, validation evidence, blockers, and
  discoveries; do not integrate into trunk or change shared scope independently.
- A requirement to use [summarize](../summarize/SKILL.md) for the proposed change's
  handoff to the orchestrator. Workers do not ask the human for approval directly;
  the orchestrator delivers the verified brief and owns the approval gate.

Workers may make as many checkpoint commits as useful. Each implementation task
ultimately becomes one coherent proposed trunk commit, including relevant tests
and documentation. The orchestrator owns shared decisions, graph updates, the
human review queue, and serialized trunk integration.

## Validate and independently review each task

Verify behavior, contracts, required checks, and relevant regressions. Each change
must leave trunk working while the larger feature may remain unfinished. Follow
the graph's exposure, compatibility, migration, and recovery requirements.

Consolidate the task's checkpoint commits into one proposed commit before human
review. Preserve unrelated work. Give the independent reviewer the task context,
relevant code, concrete diff against its base, and validation evidence. Apply
`audit` for unnecessary complexity and duplicated coverage. If no independent
reviewer is available, mark review blocked and explain why.

Fix clear defects within scope, rerun affected checks, and obtain renewed review.
Address findings or explain with evidence why no change is needed. Stop affected
work and report the blocker when repeated repairs make no progress. Do not call
failed checks or incomplete review ready for human approval.

## Obtain human approval and integrate

For every proposed trunk integration, read and apply
[summarize](../summarize/SKILL.md)'s approval brief before asking for approval.
Verify and refresh the worker's handoff against the final proposed commit,
validation, and independent review. Deliver the brief to the human; an internal
worker summary, passing checks, or a commit link alone does not satisfy this step.

Explain the outcome, consequential design decisions, concrete diff or commit,
validation, independent review results, and remaining limitations. Identify the
task ID, proposed commit, and compared trunk revision. Then ask for explicit
approval of that change. A PR is not required. Keep the brief proportional to the
change, but do not defer it until the final feature summary or after integration.

Mark the task `awaiting-human-review` and wait for explicit approval of that
change. Review feedback returns the task to implementation and affected checks.
Keep other ready tasks and independent reviews progressing while approval is
pending; queue completed changes without treating silence as consent.

After approval, integrate one task at a time:

1. Inspect current trunk and reconcile the proposed commit with any newer changes.
2. Refresh affected validation and independent review. If the change or relevant
   context differs materially from what the human approved, refresh and deliver
   the `summarize` brief for the updated change, then obtain renewed approval.
   Pure commit identity changes with an
   equivalent diff and unaffected context do not alone invalidate approval;
   record the mapping and evidence.
3. Integrate the approved task as one commit on trunk using the repository's
   permitted workflow. Do not force-push, rewrite trunk history, or bypass checks
   and protections. If protections require a PR, explain the constraint and ask
   for that workflow rather than creating one without a request.
4. Verify the shared trunk update succeeded before marking the task `integrated`.
   Record the integrated commit and evidence in context, then unblock dependents
   and dispatch newly ready work. A local commit alone is not shared integration.

If trunk advances during integration, reconcile again rather than overwriting it.
Later corrections to landed code are new tasks and commits with their own human
approval. Verification-only tasks report revision-bound evidence and finish as
`verified`; do not manufacture code changes to give them a commit.

## Handle discoveries and interruptions

Use `graph` to add, split, or reorder tasks within settled decisions and keep its
flowchart and statuses aligned. Maintain the lifecycle `blocked`, `ready`,
`implementing`, `validating`, `awaiting-human-review`, `approved`, and `integrated`,
with reasons for blockers and returns to earlier states.

Workers report discoveries to the orchestrator. Use [refine](../refine/SKILL.md)
for changes to agreed scope, behavior, architecture, or contracts. Block affected
tasks and dependents until the needed human decision is resolved; continue
unaffected work.

Update shared intent, affected tasks, dependencies, and acceptance coverage
together. Advance the planning revision in context and send revised instructions
to active workers with an explicit continue, reconcile, or pause direction.
Require acknowledgment and reconciliation before integration. Updating the
orchestrator's context alone does not update workers.

Invalidate stale validation and approval. Reopen affected unintegrated work;
create follow-up tasks for landed changes. Keep model assignments, task states,
worker assignments, commits, evidence, blockers, and next ready work in context.
At interruption, provide a concise conversation handoff; do not persist planning
files or claim that context will survive. Verify actual state on resume.

## Verify the combined outcome and hand off

As tasks integrate, verify their combined behavior against feature acceptance
examples and relevant regressions. Obtain independent review of the combined
changes, including `audit` for interactions and complexity across tasks. Scope
review to this feature's commits and affected current code, accounting for other
trunk changes. Record the exact revisions covered. New defects become follow-up
tasks that pass through the same validation and human approval gates.

Apply `summarize`'s written handoff to the whole outcome. Explain what works, how
components fit together, consequential decisions, acceptance coverage, independent
review results, integrated commits, and remaining limits. Distinguish integrated,
verified, blocked, and awaiting-human-review work; do not imply integration means
release or that a final summary retroactively approves changes.

When called by `implement`, return the walkthrough and evidence for delivery to
the human; when called directly, deliver them yourself. There is no final feature
branch or mandatory feature PR. Completion requires evidence for the combined
outcome, not merely that every worker finished.
