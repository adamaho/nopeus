---
name: execute
description: >-
  Execute or resume a feature agreement and graph one ready slice at a time.
  Coordinate PR groups,
  model assignments, independent review, and validation until the feature PR is
  ready for human review. Use build to start from an idea.
---

# Execute

Execute the current ready slice from the feature agreement and graph. Progress
through the feature one slice at a time unless the user limits scope, and stop
at a validated feature PR ready for human review.
Apply [adhd](../adhd/SKILL.md) to questions, progress updates, and handoffs.

## Scope and permissions

- An execution request authorizes branches, commits, pushes, PRs, graph and ticket
  progress updates, and smaller PR merges into the feature branch, within the
  agreed plan.
- Respect repository permissions and the user's limits. Preserve unrelated work.
- Stop before the final feature merge. Deployment and release are outside scope.
- Reading or discussing this skill does not start execution.

## Check the handoff

Read the spec, graph, repository instructions, and relevant code. Identify the
feature's scope, target branch, PR groups, dependencies, acceptance criteria,
required checks, ticket mode, and tracking location. Default to no tickets unless
`build` passes an existing choice to use tickets or the user requests them.
Without tickets: do not create or update tickets, invoke
`create-ticket`, or request tracker access. Keep progress and evidence with the
local spec and graph. Every ticket update below is conditional on ticket mode.

Read [summarize](../summarize/SKILL.md)'s shared design guidance and the references
relevant to the change. Carry those conventions and agreed exceptions into
implementation; use its detailed written summary for the final handoff.

An outlined future slice is not a blocker for the current slice unless its
unresolved details affect current guarantees. If the feature agreement or current
slice lacks required implementation detail:

- **Called by [build](../build/SKILL.md):** return the gap to the parent
  workflow for resolution.
- **Called directly:** explain what is missing and suggest `build` or the
  relevant planning skill. Do not silently start the full planning workflow.

Before starting or resuming, inspect branches, worktrees, PRs, reviews, and check
results. Reuse existing work and reconcile graph status with evidence. Clarify
conflicts before affected work proceeds.

## Confirm model assignments

Read [model selection](references/models.md). Reuse the orchestrator, worker, and
reviewer choices passed by `build` or already supplied by the user. When
invoked directly, ask for missing choices before execution. Verify availability
and retain independent review; do not silently substitute models.

## Set up the feature workspace

Create or reuse the feature branch from the intended development branch. Use
[create-pr](../create-pr/SKILL.md) for PR titles and descriptions. Open a draft
feature PR once the branch has changes; do not create empty code changes merely
to open it. Reuse an existing feature PR when present.

Create each smaller PR from a branch based on the feature branch, targeting the
feature branch. Follow repository commit and branch conventions. Link existing
tickets, graph groups, and PRs so their relationships are visible.

## Coordinate ready work

Select one ready PR group from the graph. A group starts only after its
prerequisite groups merge into the feature branch. Within it, follow node
dependencies. Default to one active implementation slice, even when multiple
groups are independent; parallel implementation requires an explicit user request.
A separate reviewer does not create another implementation slice.

Follow [graph](../graph/SKILL.md)'s size estimates and exception rules. Compare
actual added plus deleted lines against the PR's target during implementation and
before submission, including review fixes. Report generated and lockfile changes
separately alongside the total. Revisit the boundary as the diff approaches
600–700 lines. If it will exceed 700 without an agreed exception, explain the
actual size and a coherent split or exception for the user to decide before
continuing the oversized PR. Preserve work; do not discard changes to shrink it.

Give each worker:

- The spec and graph references, assigned node IDs, and PR group scope.
- Relevant contracts, settled decisions, prerequisites, and acceptance criteria.
- The relevant `summarize` design references and any agreed exceptions.
- Its branch, worktree, target branch, and required checks.
- [audit](../audit/SKILL.md) to simplify implementation and reuse test coverage.
- A requirement to report changes, evidence, blockers, and the commit or PR link.

The orchestrator owns integration, merges, and shared graph and ticket updates.
Workers send unanswered questions to the orchestrator, who asks the user.
Workers must not silently expand scope or change shared contracts.

## Review and merge each group

Verify the group's behavior and contracts, run relevant checks, and obtain
independent review before merging into the feature branch. Preserve existing
functionality as required by the graph; the full feature may remain incomplete.

Give the reviewer the spec, group scope, relevant code, diff against its target,
and validation evidence. Apply [audit](../audit/SKILL.md) for excess complexity
and coverage duplicated elsewhere. The implementer simplifies within scope;
the reviewer verifies. Ground findings in the changes. If no independent reviewer
is available, mark review blocked and explain why.

Fix clear defects within scope, rerun affected checks, and obtain renewed review.
Address each finding or explain with evidence why no change is needed. If repairs
repeat without progress, report the blocker and stop affected work.

Before merging, confirm checks and review cover the current changes. If the
feature branch changed, assess the impact and repeat affected validation or
review. Respect branch protections; do not bypass failed checks or required review.

Confirm the merge succeeded before marking the group merged or unblocking its
dependents. Update the graph and child ticket with links, observed evidence, and
actual PR size. Before detailing or implementing the next slice, deliver a written
[summarize](../summarize/SKILL.md) checkpoint covering this slice's outcome,
relevant interfaces and data structures, validation, and what remains unfinished.
When delegated, send it to the orchestrator for delivery to the human.

Use what was learned to refine and specify the next outlined slice, then update
the graph and its estimate. Through `build`, return to its planning stages.
When invoked directly, continue already-ready slices; if the next needs decisions
or missing planning detail, preserve progress and request the relevant planning
step rather than silently treating an outline as ready. Routine progression needs
no new approval when scope and decisions are already settled.

## Handle discoveries and interruptions

Use [graph](../graph/SKILL.md) to add, split, reorder, or regroup work within
settled decisions. Keep its flowchart, tickets, dependencies, and status aligned.

If discoveries affect agreed scope, behavior, architecture, or contracts, use
[refine](../refine/SKILL.md) before affected work continues. Mark affected nodes
and dependents blocked; keep the current slice in focus. Ask before reordering
implementation to another slice.

Save progress alongside the graph: model assignments, branches and PRs, completed
groups, evidence, blockers, and next ready work. Distinguish written, validated,
reviewed, and merged work. On resume, verify actual state before continuing.

## Prepare the final handoff

After all groups are integrated:

1. Bring the latest target-branch changes into the feature branch. Resolve routine
   conflicts; use `refine` for conflicts requiring decisions.
2. Validate the integrated feature against the spec's acceptance criteria and
   repository checks, including relevant regressions and cross-group behavior.
3. Obtain independent agent review of the combined feature diff against the
   target branch, including `audit` for complexity and duplicate coverage across
   groups. Repair findings and refresh affected validation and review.
4. Update the feature PR and graph with the final state. Mark the feature PR
   ready for human review only when the required evidence is complete.

Use `create-pr` for the PR description. Keep detailed evidence in linked tracking
records. Before writing the final response, apply
[summarize](../summarize/SKILL.md)'s detailed written implementation summary to the
combined completed work. This is mandatory whenever an implementation is
completed, including when `execute` is invoked directly. Explain changes,
components and flow, interfaces and public APIs, data structures and state, and
consequential decisions where relevant.
Explain the result in the final response; do not end with only PR links, check
results, or an offer to summarize later. Independent agent review does not replace
this human-facing explanation. Include:

- The feature PR and the validated commit and target-branch commit.
- Acceptance criteria covered and validation results.
- Independent review results and remaining limitations.

When called by `build`, return the detailed summary and evidence to the
orchestrator for delivery in its final response. When called directly, deliver
them to the human. Cover all completed groups, not just the last PR or worker's
changes, and distinguish completed work from unfinished or deferred scope.

If execution stops partially complete or blocked, still summarize completed
changes and identify unfinished scope and blockers. Do not call blocked or
unverified work ready.

Leave the feature PR open and the root outcome awaiting human review and final
merge. Ready for review does not mean the feature is complete.
