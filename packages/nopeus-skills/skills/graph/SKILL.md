---
name: graph
description: >-
  Plan and maintain a dependency graph for a software change, with implementation
  nodes, PR groups, and completion evidence. Use with a spec when asked to plan
  dependencies, organize reviewable work, or update a plan after new discoveries.
  This skill plans work; it does not execute it.
---

# Graph

Turn a spec into a plan that people and agents can follow. Keep the graph alongside
the spec in its ticket or document. Record requirements for implementation and
review without performing those activities.

## Ground the plan

- Read the spec and relevant code. Check existing behavior, architecture,
  contracts, acceptance examples, and repository checks.
- Confirm that the feature agreement and current slice still match relevant
  code. The current slice needs implementation-ready detail; future groups can
  remain outlined with provisional boundaries and explicit open decisions.
  Keep work based on a stale or unresolved contract provisional. Return agreement
  changes to `spec` and unresolved decisions to `refine`; do not silently invent
  requirements or architecture while decomposing the work.
- Reuse settled decisions. Use [refine](../refine/SKILL.md) to resolve unanswered
  questions that affect the plan. Do not replace missing decisions with guesses.
- Mark affected nodes and their dependents as blocked until questions are resolved.
  Preserve the planned order rather than silently switching to another slice.

## Build the graph

Represent the completed feature as the root outcome. Break it into small
implementation nodes, including integration work. Map likely PR boundaries and
dependencies across the feature, but fully detail only the current slice. Future
nodes may carry provisional scope and estimates; do not invent contracts or
completion evidence to fill fields. Expand them before execution. Shared
prerequisites can support multiple nodes; do not force the graph into a tree.

For each node, record:

- **ID and outcome:** a stable identifier and what the node contributes.
- **Scope:** affected components, relevant contracts, and exclusions.
- **Prerequisites:** node IDs and why each is needed, including the contracts
  or integrated outputs consumed from them.
- **Completion evidence:** observable behavior or checks that establish completion.
- **Coverage:** the spec acceptance examples this node contributes to.
- **Tracking:** status, PR group, and existing ticket or PR links.

Use prerequisite IDs as the authoritative dependency relationships. Existing
capabilities do not need new implementation nodes.

## Check slice readiness

A slice is a bounded, independently verifiable change that fits one reviewable
PR. It may complete a database, server, or frontend layer, or a narrow end-to-end
behavior. Choose a coherent finish condition rather than forcing all layers into
every slice. Treat each PR group as the unit an implementing agent can own.
Its nodes and linked spec must supply a bounded outcome, relevant code entry points, agreed
inputs and outputs, acceptance coverage, and a feasible verification method.
Reference the canonical spec rather than copying contracts into competing plans.
For shared interfaces or data, identify the owning group and the consumers;
parallel workers must not independently invent the same contract.

Distinguish a planned slice from one ready to execute. Mark a group ready only
when its cross-group prerequisites are integrated, required decisions are settled,
and implementation and verification prerequisites are available. Record blockers
and affected dependents explicitly. A future group can be well specified while
still waiting on a prerequisite.

Check that a fresh agent could complete the group using these references without
guessing intent. Leave routine implementation choices to it within the spec's
boundaries. Split work only when the boundary makes ownership, dependencies, or
review clearer; do not create a node for every helper or file.

## Visualize the graph

Include a flowchart with every generated or updated graph. Use Mermaid where the
destination supports it; otherwise use a supported diagram format or an attached
image alongside the graph.

- Show the completed feature, implementation nodes, and dependency arrows.
- Label nodes with their stable IDs and short outcome names.
- Visually group nodes by PR group and label each group. Distinguish outlined
  future work from ready, active, and completed slices.
- Draw arrows from prerequisites to dependent nodes and explain that direction.
- Keep the chart consistent with the recorded dependencies and PR groups whenever
  the plan changes. For large graphs, use an overview and linked detail charts.

Check that every acceptance example has coverage, including final integration.
Remove dependency cycles by revising boundaries or resolving contracts. Preserve
stable IDs when updating the graph; record replacements for removed or split nodes.

## Group work for review

Group related nodes into PRs with a clear scope and reviewable diff. Nodes can be
internal implementation steps; each group need not deliver a complete user journey.

Record this branch structure in the plan:

- A feature branch has a feature PR targeting the main development branch.
- Smaller PRs target the feature branch.
- Cross-group prerequisites must merge into the feature branch before dependent
  groups start. Within a group, nodes follow dependency order.
- Default to one active implementation slice. Finish its implementation, checks,
  independent review, integration into the feature branch, and human-facing
  summary before detailing and starting the next. Record dependencies even when
  work is sequential; parallel implementation requires an explicit user request.

Ensure grouping does not introduce cycles between PR groups. Each group records
its node IDs, scope, prerequisites, and required review and validation evidence.

## Estimate PR size

For each likely PR group, estimate added plus deleted lines as a range. Include
implementation, tests, migrations, and documentation. State the basis in relevant
code or analogous changes and the uncertainty; estimates are planning aids, not
promises. Rough estimates are sufficient for outlined future slices; refine the
current estimate as its agreement becomes concrete.

Target roughly 300–500 changed lines and aim below 600. Reconsider grouping as an
estimate approaches 600–700. If a coherent change is expected to exceed 700,
explain why, offer a meaningful split when possible, and agree on the exception
with the user before proceeding. Do not compress code, omit necessary coverage,
or split an invariant arbitrarily to meet the target. Report generated files and
lockfile churn separately alongside the total; do not silently exclude them.

Measure each PR against its actual target branch. If retaining an aggregate
feature PR, estimate its combined diff too and agree on an exception or a different
integration plan when it exceeds the same limit. Small child PRs do not make a
large final PR small. Record estimates, agreed exceptions, and actual sizes with
the graph; use actual results to revise later estimates.

## Define completion requirements

For each smaller PR group, require:

- Agent review and the repository's required checks.
- Evidence that its own behavior and contracts work.
- Preservation of existing functionality, including relevant permissions,
  failure cases, and data integrity.

The larger feature may remain incomplete after a group merges. Record exposure,
compatibility, migration, and recovery requirements where relevant; a feature
branch alone does not establish that a change is safe to deploy.

For the completed feature, require:

- Integration and full validation against the spec's acceptance criteria.
- Agent review of the combined feature diff against the main development branch.
- Human review before the feature PR merges into that branch.

Distinguish planned evidence from observed results. Completed nodes alone do not
prove the root outcome: final validation and review must also have evidence.

## Map the graph to tickets

Default to no tickets unless `build` passes an existing choice to use tickets
or the user explicitly requests them, such as "build with tickets".
In no-ticket mode, skip this entire mapping and do not invoke `create-ticket`,
even for drafts. Keep spec and graph references, PR links, estimates, progress,
and evidence in the requested local files or ignored scratch location; no tracker
or ticket IDs are required. Existing tickets remain unchanged. All ticket mapping
and ticket update requirements below apply only in ticket mode.


- **Parent:** holds the feature spec and graph, with a link to the feature PR
  when available. If the spec lives in a separate document, link to it instead
  of duplicating it.
- **Child ticket per PR group:** describes the group's scope, node IDs,
  prerequisites, size estimate, acceptance criteria, and required review and
  validation evidence. Keep future tickets provisional until their slice is
  refined; do not invent acceptance detail to populate a tracker.
  Link it to the parent and its PR when available.
- **Nodes:** remain entries in the graph, not separate tickets.

Use [create-ticket](../create-ticket/SKILL.md) to draft the tickets, preserving
necessary spec detail. Reuse existing tickets where they cover the planned work.
Publish or update tracker tickets only when requested; otherwise return drafts.

## Maintain the graph

Add, split, regroup, or reorder nodes as dependencies are discovered, while
preserving agreed scope, behavior, architecture, and contracts. Record what changed
and why so the plan remains understandable.

When PR groups change in ticket mode, update their ticket mapping and flag
affected ticket descriptions for revision. Keep the graph authoritative for node dependencies.

If a discovery raises an unanswered question about those decisions, use `refine`
before affected work continues. Reflect the blocker in the graph and reconsider
downstream dependencies, PR groups, and acceptance coverage after resolution.

Update status from reported or verified evidence, with links where available.
Distinguish implementation, validation, review, and merge status; do not treat
code written as code merged or a planned check as a passed check.

## Delivery

Apply [adhd](../adhd/SKILL.md) to polish wording, grammar, and formatting while
preserving the graph's dependencies and necessary detail.

Save or update the graph alongside the spec. In no-ticket mode, use the requested
local destination or ignored `.scratch/specs/` location without asking for tracker
access. In ticket mode, use the requested ticket or document; if its destination
or access is missing, ask for what is needed and retain the draft in the
conversation. Avoid maintaining a competing authoritative copy.

Return the graph link or draft, a brief readiness status, and unresolved blockers.
This skill does not implement nodes, run validation, conduct reviews, create
branches or PRs, or merge changes. The plan describes those requirements for a
separate execution workflow.
