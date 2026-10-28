---
name: summarize
description: >-
  Explain software changes through a detailed summary of behavior, components,
  interfaces, public APIs, and data structures. Use when asked to summarize a
  PR or implementation, when shaping specs, and as the mandatory final handoff
  from build or execute.
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
interfaces as proposals and link existing contracts instead of copying them.

Keep only change-specific decisions and necessary exceptions in the spec. Link
the shared conventions once. Acceptance examples belong in the spec; task order,
PR groups, and progress belong in [graph](../graph/SKILL.md). Do not require the
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

## Write the implementation summary

Every implementation completed through `build` or `execute` must end with
this detailed written summary in the final response. Deliver it automatically;
do not wait for the human to request it. An internal agent review or an earlier
progress update does not satisfy this requirement. When work stops partially
complete or blocked, summarize what was actually implemented and identify what
remains unfinished.

Explain the completed work across the session so the human can understand and
evaluate it without reading code or reopening earlier messages. Use the combined
diff, surrounding code, consumers, and execution evidence, not only the last
commit or PR. Describe implemented behavior, not just what the spec proposed.

Cover the following where relevant to the change:

- **Outcome and changes:** what changed, why, and what users or systems can do
  now. Use a concrete before-and-after example when useful. Separate completed
  work from deferred or unfinished scope.
- **Components and flow:** the main components, their responsibilities, how
  they compose, and the request or data flow between them. Explain where state
  and dependencies are owned.
- **Interfaces and public APIs:** added, changed, or removed exports, component
  props and callbacks, service contracts, or endpoints. Explain important inputs,
  outputs, errors, consumer usage, and compatibility or breaking changes. Include
  exact names and small signatures or consumer examples when they clarify a contract.
- **Data structures and state:** important types, schemas, entities, relationships,
  state transitions, and persistence changes. Explain constraints, invariants,
  and migration implications that matter to consumers or correctness.
- **Decisions and tradeoffs:** consequential design choices, reuse of existing
  capabilities, and departures from the agreed plan, with their practical effects.
- **Evidence and limits:** what was validated, what independent review found,
  the revisions covered, and anything still unverified or blocked.
- **Human attention:** remaining decisions or concerns and links to the PR, spec,
  graph, and tickets where available. State whether the work is ready for human
  review and whether it has merged or been released.

Scale depth to the change while preserving the detail needed to understand it.
Omit irrelevant categories rather than inventing APIs or data changes. Group
related changes by outcome or responsibility; do not enumerate every file.
Keep wording direct and easy to scan; concision must not remove meaningful
contracts, data structures, or explanations. Explain technical terms in plain
language. Add a small diagram when it makes relationships clearer. Source links
support the explanation; understanding it must not depend on opening them.

Deliver the written summary immediately. Do not substitute a status-only recap,
a list of links, an interactive walkthrough, or an offer to run `summarize` next.
Ask a focused follow-up only when a material decision needs the human's answer;
do not invent an approval question.

## Offer depth when requested

When the user requests an interactive walkthrough, start with a short brief:
what changed, how the pieces fit together, the important interfaces, and the decisions or concerns that deserve attention. Scale the brief
to the change; do not narrate every file or fill unrelated sections.

Then walk through one consequential decision at a time, starting with the most
important. For each, explain the current design, its practical effect, relevant
alternatives, and your recommendation. Use a small diagram, selected interface
snippet, or consumer example with links to the inspected evidence. Label shortened
or illustrative examples so they are not mistaken for the full implementation.

Distinguish a demonstrated problem from an agreed convention or a preference that
needs the human's judgment. Ask one focused question when an answer is needed,
wait for it, and reuse the answer in later discussion. Do not manufacture a concern
or approval question when there is no material decision. Honor requests for a
single written overview instead of a guided conversation.

Report validation gaps plainly. Keep the walkthrough in the conversation or the
requested review destination; [create-pr](../create-pr/SKILL.md) owns the concise
PR description. Do not publish comments, edit code, or merge solely because
a summary or walkthrough was requested. When fixes are authorized, use the
established workflow and update affected decisions and evidence.
