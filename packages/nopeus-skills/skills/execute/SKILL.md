---
name: execute
description: >-
  Execute or resume an existing software spec and dependency graph through
  implementation, independent review, and validation. Coordinate PR groups and
  mixed-model agents, stopping at a feature PR ready for human review. Use
  implement for the full journey from an idea through planning and implementation.
---

# Execute

Execute a ready spec and graph. Work through the whole feature unless the user
limits scope, and stop at a validated feature PR ready for human review.
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
required checks, and tracking location.

If the spec or graph is missing or incomplete, identify the gap and return it to
[implement](../implement/SKILL.md) when it is coordinating the work. When invoked
directly, explain what is needed and suggest `implement` or the relevant planning
skill. Do not silently expand an execution request into the full planning workflow.

Before starting or resuming, inspect branches, worktrees, PRs, reviews, and check
results. Reuse existing work and reconcile graph status with evidence. Clarify
conflicts before affected work proceeds.

## Confirm model assignments

Read [model selection](references/models.md). Reuse the orchestrator, worker, and
reviewer choices passed by `implement` or already supplied by the user. When
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

The orchestrator selects ready PR groups from the graph. Cross-group prerequisites
must be merged into the feature branch before dependent groups start. Within a
group, implement nodes in dependency order.

Delegate independent groups in isolated worktrees when useful. Handle overlapping
changes and shared integration work sequentially. Also work sequentially when
parallel execution is unavailable or adds little value. Keep the selected models
and independent review requirement.

Give each worker:

- The spec and graph references, assigned node IDs, and PR group scope.
- Relevant contracts, settled decisions, prerequisites, and acceptance criteria.
- Its branch, worktree, target branch, and required checks.
- A requirement to report changes, evidence, blockers, and the commit or PR link.

The orchestrator owns integration, merges, and shared graph and ticket updates.
Workers send unanswered questions to the orchestrator, who asks the user.
Workers must not silently expand scope or change shared contracts.

## Review and merge each group

Verify the group's behavior and contracts, run relevant checks, and obtain
independent review before merging into the feature branch. Preserve existing
functionality as required by the graph; the full feature may remain incomplete.

Give the reviewer the spec, group scope, relevant code, diff against its target,
and validation evidence. Findings must be grounded in the changes. If no independent
reviewer is available, mark review blocked and explain why.

Fix clear defects within scope, rerun affected checks, and obtain renewed review.
Address each finding or explain with evidence why no change is needed. If repairs
repeat without progress, report the blocker and stop affected work.

Before merging, confirm checks and review cover the current changes. If the
feature branch changed, assess the impact and repeat affected validation or
review. Respect branch protections; do not bypass failed checks or required review.

Confirm the merge succeeded before marking the group merged or unblocking its
dependents. Update the graph and child ticket with links and observed evidence.

## Handle discoveries and interruptions

Use [graph](../graph/SKILL.md) to add, split, reorder, or regroup work within settled decisions. Keep
its flowchart, ticket mapping, dependencies, and status consistent.

If discoveries affect agreed scope, behavior, architecture, or contracts, use
[refine](../refine/SKILL.md) to resolve questions before affected work continues. Mark affected
nodes and dependents blocked; continue independent work where possible.

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
   target branch. Repair findings and refresh affected validation and review.
4. Update the feature PR and graph with the final state. Mark the feature PR
   ready for human review only when the required evidence is complete.

Use `create-pr` for the PR description. Keep detailed evidence in linked tracking
records. In the handoff, report:

- The feature PR and the validated commit and target-branch commit.
- Acceptance criteria covered and validation results.
- Independent review results and remaining limitations.

Do not call blocked or unverified work ready.

Leave the feature PR open and the root outcome awaiting human review and final
merge. Ready for review does not mean the feature is complete.
