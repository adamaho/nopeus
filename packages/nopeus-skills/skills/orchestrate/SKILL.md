---
name: orchestrate
description: >-
  Execute or resume a ready task graph on a feature branch using parallel
  workers, validation, independent review, and human approval before each task
  merges, or unattended to the end when the human asks, then open one PR to
  trunk. Use implement to start from an idea.
  Tickets and planning files are not required.
---

# Orchestrate

Carry out the agreed graph through small, validated changes to one feature
branch, then open a PR from that branch to trunk. Work through all ready tasks
unless the user limits scope. By default, obtain explicit human approval before
integrating each implementation task; when the human asks for an unattended run,
integrate reviewed tasks without waiting and leave the approval to the PR. Apply [adhd](../adhd/SKILL.md)
throughout.

## Scope and permissions

An execution request authorizes creating the feature branch, implementation in
isolated checkouts, local commits, validation, independent review, in-context
graph updates within the agreed scope, and opening the final PR. It does not
authorize integrating unreviewed changes into the feature branch, or merging
anything into trunk. Human approval applies to the concrete change presented, not
all future tasks, unless the human has asked for an
[unattended run](#run-unattended-when-asked).

Use [create-ticket](../create-ticket/SKILL.md) only when requested. Never merge
the PR; the human does that.
Respect repository protections, user limits, and unrelated work. Deployment and
release are outside scope. Reading or discussing this skill does not start work.

## Create the feature branch

Every graph runs on one feature branch. Before dispatching the first task, create
it from current trunk, or reuse the branch the user named or an earlier session
started. Name it by the repository's conventions and record its name and the trunk
revision it started from in context. Do not commit task work to trunk.

Tasks reach trunk only through the final PR, so unfinished work never lands
there, while each task still gets its own review on the way into the branch.

## Check the handoff

Read the agreed intent and [graph](../graph/SKILL.md) in available conversation
context, repository instructions, and relevant code. Identify the trunk branch,
the feature branch, task IDs, prerequisites, shared contracts, acceptance examples, required checks,
and any existing implementation or approval evidence. A separate spec document
is not required.

Load [summarize](../summarize/SKILL.md), using the agent's skill tool or by reading
the linked `SKILL.md` when no such tool exists. Use its shared design guidance and
relevant references for implementation and human briefs. If the graph lacks
a consequential decision, return the gap to `implement` when called by that workflow; when called
directly, explain the gap and use the relevant planning skill within authorized
scope. Block only affected work rather than inventing requirements.

Before starting or resuming, inspect actual checkouts, the feature branch, trunk,
commits, validation, reviews, and any PR already open for the branch. Reconcile the
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
the feature branch, necessary decisions are settled, and required resources are available.
Launch workers for all ready, independent tasks up to available tool, environment,
and user limits. Do not impose an arbitrary agent count or process unrelated
tasks sequentially. Refill available capacity as workers finish or tasks unblock.
Use separate reviewers as needed within the same capacity limits.

Use isolated checkouts, such as detached worktrees or isolated agent environments,
each started from the current feature branch. Named task branches are not
required. Account for shared resources and semantic
conflicts; serialize tasks when their interference requires it and explain why.
If parallel execution is unavailable, proceed sequentially while preserving
selected model assignments and independent review requirements.

Construct a complete prompt for each worker, including:

- Task ID, outcome, scope, exclusions, and the current planning revision.
- Relevant shared intent, exact contracts, settled decisions, and integrated
  prerequisites; do not assume the worker inherits conversation context.
- Acceptance examples, required checks, and relevant design guidance.
- Assigned checkout, the feature-branch revision it starts from, and relevant
  code references.
- [audit](../audit/SKILL.md) guidance for simplicity and useful test coverage.
- Instructions to report changes, commits, validation evidence, blockers, and
  discoveries; do not integrate into the feature branch or change shared scope
  independently.
- A requirement to load [summarize](../summarize/SKILL.md) and follow it for the
  proposed change's handoff to the orchestrator. Workers do not ask the human for
  approval directly; the orchestrator delivers the verified brief and owns the approval gate.

Workers may make as many checkpoint commits as useful. Each implementation task
ultimately becomes one coherent proposed commit on the feature branch, including
relevant tests and documentation. The orchestrator owns shared decisions, graph
updates, the human review queue, and serialized integration into the feature
branch.

## Validate and independently review each task

Verify behavior, contracts, required checks, and relevant regressions. Each change
must leave the feature branch working while the larger feature may remain
unfinished. Follow
the graph's exposure, compatibility, migration, and recovery requirements.

Consolidate the task's checkpoint commits into one proposed commit before human
review. Preserve unrelated work. Have the independent reviewer load
[review](../review/SKILL.md) and follow it; it defines the review, its report,
and how findings close. Give the reviewer the task, its acceptance examples, the
proposed commit, the feature-branch revision it is compared with, and the
validation evidence. If no independent reviewer is available, mark review
blocked and explain why.

Send the reviewer's report to the worker that wrote the task, in its existing
session, to fix within scope and rerun affected checks, then return the result to
the same reviewer for re-review. Stop affected work and bring it to the human
when `review` says to. Do not call
failed checks or incomplete review ready for human approval.

## Run unattended when asked

Per-task approval is the default. The human can switch it off for a graph by
saying so plainly: "run it to the end", "don't wait for me", "set and forget".
Agreeing to a plan, or going quiet, is not that request. If you cannot tell, ask
once before starting. The human can turn it on or off partway through, and the
change applies to tasks not yet integrated.

An unattended run removes one thing: the wait for the human before each task
integrates. Everything else still happens, because it is what the human will
rely on when they come back:

- Every task is validated and independently reviewed, and a task whose checks
  fail or whose review is `Blocked` does not integrate.
- Every task still gets its `summarize` brief, built before it integrates. Ask
  for kind `summary`, since no approval is being requested, and ask it to keep
  the page, because it will be read after the task has landed. Do not delete the
  pages on integration.
- What `review` would have left for the human to accept, such as a declined
  Warning, goes into that task's brief as a `Known issue`, and the task
  integrates.

Stop a task, and everything that depends on it, when it needs the human: a
decision that changes agreed behavior, scope, architecture, or contracts; a
Critical still open after `review`'s rounds; checks that will not pass. Record
why, keep every other task moving, and do not guess to stay unblocked.

The PR is the approval gate for an unattended run. In the final handoff, say
that tasks were integrated without per-task approval, list each task with its
brief, and gather every `Known issue`, stopped task, and open decision in one
place, so the human can review the whole in the order that matters.

## Obtain human approval and integrate

This section describes the default. In an unattended run, build the brief, skip
the wait, and integrate as below.

For every task proposed for the feature branch, build an approval brief with
[summarize](../summarize/SKILL.md) before asking for approval. Load `summarize`
again if it is no longer in context; it defines the brief, so do not write one
from memory. Give it the task ID, the proposed commit, the feature-branch
revision it is compared with, and the current graph with statuses. Verify and refresh the worker's
handoff against the final proposed commit, validation, and independent review
first; findings `review` leaves for the human belong in the brief. An internal worker
summary, passing checks, or a commit link alone does not satisfy this step.

Then ask for explicit approval of that change. Do not defer the brief until the
final feature summary, the PR, or after integration; the PR reviews the whole,
not each step.

Mark the task `awaiting-human-review` and wait for explicit approval of that
change. Review feedback returns the task to implementation and affected checks.
Keep other ready tasks and independent reviews progressing while approval is
pending; queue completed changes without treating silence as consent.

After approval, integrate one task at a time:

1. Inspect the current feature branch and reconcile the proposed commit with any
   tasks integrated since it started.
2. Refresh affected validation and independent review. If the change or relevant
   context differs materially from what the human approved, refresh and deliver
   the `summarize` brief for the updated change, then obtain renewed approval.
   Pure commit identity changes with an
   equivalent diff and unaffected context do not alone invalidate approval;
   record the mapping and evidence.
3. Integrate the approved task as one commit on the feature branch. Do not
   rewrite the branch's history once tasks have integrated, and do not bypass
   checks and protections.
4. Verify the feature-branch update succeeded before marking the task `integrated`.
   Record the integrated commit and evidence in context, then unblock dependents
   and dispatch newly ready work. A commit in a worker's checkout alone is not
   integration.
   Then delete the task's brief page, unless the run is unattended; `summarize`
   explains why.

If the feature branch advances during integration, reconcile again rather than
overwriting it. Later corrections to integrated code are new tasks and commits
with their own human approval. Verification-only tasks report revision-bound evidence and finish as
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

## Verify the combined outcome and open the PR

As tasks integrate, verify their combined behavior on the feature branch against
feature acceptance examples and relevant regressions. Obtain an independent
[review](../review/SKILL.md) of the combined changes, with the whole feature
branch against trunk as its scope, so interactions across tasks are covered. Record the exact revisions covered. New defects become follow-up tasks
that pass through the same validation and human approval gates.

When every task is integrated or verified, bring the feature branch up to date
with trunk by merging trunk in, unless the repository requires a rebase, and
rerun the checks that the update could affect. If trunk's changes alter behavior a human already approved, say so
in the final brief.

Load `summarize` again if it is no longer in context, then build its final
handoff brief for the whole outcome. Give it trunk as the base, the feature
branch as the head, and the final graph, so integrated, verified, blocked, and
awaiting-human-review work stay distinct. Do not imply integration means release
or that a final brief retroactively approves changes.

Then open one PR from the feature branch to trunk with
[create-pr](../create-pr/SKILL.md). If tasks remain blocked or unapproved, ask
before opening it, and open it as a draft if the human wants it up early. An
unattended run that ends with stopped tasks opens a draft without asking, so the
finished part is ready to read. The
skills never merge the PR.

When called by `implement`, return the brief, the PR link, and evidence for
delivery to the human; when called directly, deliver them yourself. Completion
requires evidence for the combined outcome and an open PR, not merely that every
worker finished.
