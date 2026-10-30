---
name: summarize
description: >-
  Summarize software design and implementation for human evaluation: how
  components fit together, who owns each responsibility, and what public interfaces connect
  them. Use when shaping specs, walking a human through a PR or code change,
  or preparing per-change approval briefs and final handoffs for implement or
  orchestrate. Summaries do not replace independent correctness review.
---

# Summarize

Read and apply [adhd](../adhd/SKILL.md) to every spec contribution, overview,
diagram, question, and walkthrough. Help the human evaluate the design without
having to read the full diff. Use small interface and consumer examples where
they make a decision clearer.

## Establish the context

Identify the requested change, relevant code, consumers, repository conventions,
and agreed decisions. Read the references relevant to the work:

- [React](references/react.md) for components, props, routing, and client data.
- [Backend and APIs](references/backend.md) for domains, repositories, services,
  HTTP contracts, and Effect composition.

Apply the shared defaults below and the relevant references during planning,
implementation, and human review. Follow explicit user and repository decisions;
surface consequential conflicts instead of silently changing the architecture.
Existing code is evidence of current behavior, not proof that every choice is good.

## Shared design guidance

- Organize by feature or domain. Keep related code local; extract a package when
  sharing or an explicit public boundary warrants it. Follow the repository's
  concrete layout rather than requiring a literal `features/` directory.
- Make responsibilities, data ownership, dependency direction, and composition
  visible. Show the relevant folder structure and where dependencies are wired.
  Create only the folders and layers the change needs.
- Review public interfaces for external consumers and other domains in the same
  project: inputs, outputs, meaningful errors, and compatibility. Keep private
  implementation details behind those interfaces; public subpaths are fine.
- Reuse established capabilities. Explain why a new abstraction or dependency is
  useful and how a consumer uses it. Identify concrete reuse opportunities.

## Shape a spec

When called by [spec](../spec/SKILL.md), apply this guidance inside the existing
spec workflow. Do not create a separate architecture document or repeat the spec.

Keep the design understandable through a compact responsibility map, the changed
interfaces, and the consequential decisions. Use a small diagram, folder tree,
or consumer snippet when it explains more clearly than prose. Label proposed
interfaces as proposals. Show selected changed contracts needed to evaluate the
design, with source links for supporting context.

Keep only change-specific decisions and necessary exceptions in the spec. Link
the shared conventions once. Acceptance examples belong in the spec; task order,
dependencies, and progress belong in [graph](../graph/SKILL.md). Do not require the
human to approve every convention again. Use [refine](../refine/SKILL.md) when a
consequential decision remains unresolved.

## Inspect an implemented change

For a PR, verify the target and head revisions and inspect the full relevant diff,
surrounding implementation, and consumers. For local changes, identify the
comparison being reviewed. Trace the affected request or data flow across layers.

Compare the implementation with the agreed design and explain meaningful drift.
A standalone summary can use the PR, issue, and repository context without a spec;
state missing intent rather than inventing requirements or starting planning.

Use validation and independent code-review results as evidence, with their
revision and limits. Do not present a spec, test name, or passing lint as proof
that the implementation behaves correctly. Reuse [audit](../audit/SKILL.md)
findings for unnecessary complexity; this walkthrough does not replace independent
correctness review. Keep discovered bugs visible with supporting evidence.

## Show changed contracts

Show meaningful changed contracts with concise code snippets: schemas, type
signatures, or consumer examples. Use actual implementation excerpts and label
simplified examples or omitted annotations. Keep snippets proportional to the
change, with source links as supporting evidence; the brief should be
understandable without opening them.

## Write an approval brief or final handoff

When called before a task integrates, summarize that proposed change for human
approval. Identify its task ID, concrete diff or commit, compared trunk revision,
validation, independent review results, and limitations. Hand the approval decision
back to `orchestrate`; a summary is not approval to integrate. Describe proposed
behavior as proposed until integration is verified.

When called by `implement` or `orchestrate` at the end of work, use this written
handoff as the final response. Explain the completed work across the session so
the human can evaluate it without reading code or reopening earlier messages.
Use the combined diff and execution evidence, not only the last commit or PR.

Cover what matters for this change:

- **Outcome:** what users or systems can do now, with a concrete before-and-after
  example when useful. Separate completed work from deferred or unfinished scope.
- **How it works:** the main components, their responsibilities, and the request
  or data flow between them. Explain technical terms in plain language.
- **Interfaces and decisions:** meaningful changes to public contracts, design
  tradeoffs, and departures from the agreed plan, with their practical effects.
- **Compatibility and release:** affected consumers, breaking behavior, and any
  migration or rollout needs where relevant.
- **Evidence and limits:** what was validated, what independent review found,
  the revisions covered, and anything still unverified or blocked.
- **Human attention:** decisions or concerns that remain, plus links to the PR,
  spec, graph, and tickets where available. State whether the work is ready for
  human review and whether it has merged or been released.

Scale the detail to the work. Group related changes by outcome or responsibility;
do not enumerate every file. Add a small diagram when it makes the relationships
clearer. Apply "Show changed contracts" to written briefs and interactive reviews;
source links support the explanation rather than replacing it.

Deliver the overview immediately. Do not substitute a status-only summary, a
list of links, or an offer to run `summarize` next. Ask a focused follow-up only when
a material decision needs the human's answer. Preserve the explicit per-change
integration approval gate when called by `orchestrate`; for a standalone summary,
do not invent an approval request.

## Guide an interactive review

Start with a short brief: what changed, how the pieces fit together, the important
interfaces, and the decisions or concerns that deserve attention. Scale the brief
to the change; do not narrate every file or fill unrelated sections.

Then walk through one consequential decision at a time, starting with the most
important. For each, explain the current design, its practical effect, relevant
alternatives, and your recommendation. Use a small diagram, selected interface
snippet, or consumer example with links to the inspected evidence. Label shortened
or illustrative examples so they are not mistaken for the full implementation.

Distinguish a demonstrated problem from an agreed convention or a preference that
needs the human's judgment. Ask one focused question when an answer is needed,
wait for it, and reuse the answer in later discussion. Do not manufacture a concern
when there is no material decision. This does not waive the required approval
before a proposed change integrates into trunk. Honor requests for a single
written overview instead of a guided conversation.

Report validation gaps plainly. Keep the walkthrough in the conversation or the
requested review destination; [create-pr](../create-pr/SKILL.md) owns the concise
PR description. Do not publish comments, edit code, or merge solely because a
summary was requested. When fixes are authorized, use the established workflow
and update affected decisions and evidence.
