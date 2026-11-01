---
name: summarize
description: >-
  Summarize software design and implementation for human evaluation: how
  components fit together, who owns each responsibility, and what public
  interfaces connect them. Use when shaping specs, walking a human through a PR
  or code change, or preparing per-change approval briefs and final handoffs for
  implement or orchestrate. Summaries do not replace independent correctness review.
---

# Summarize

Help the human evaluate a design or change without reading the full diff. Apply
[adhd](../adhd/SKILL.md) to every brief, diagram, question, and walkthrough.

## Establish the context

Identify the change, relevant code, consumers, repository conventions, and
agreed decisions. Read the reference that matches the work:

- [React](references/react.md): components, props, routing, client data.
- [Android](references/android.md): screens, UI state, navigation, lifecycle,
  data access, Compose or Views.
- [Backend and APIs](references/backend.md): domains, repositories, services,
  HTTP contracts, Effect composition.

Each reference ends with what to show and what counts as evidence on that
platform. Use it to choose excerpts; priorities differ by platform.

## Shared design guidance

- **Organize by feature or domain.** Keep related code local. Extract a package
  only when sharing or an explicit public boundary warrants it. Follow the
  repository's layout; a literal `features/` folder is not required.
- **Make boundaries visible.** Show who owns each responsibility and its data,
  which direction dependencies point, and where they are wired. Create only the
  folders and layers the change needs.
- **Review public interfaces.** For external consumers and other domains in the
  same project: inputs, outputs, meaningful errors, and compatibility. Keep
  private details behind the interface; public subpaths are fine.
- **Reuse before adding.** Explain why a new abstraction or dependency is useful
  and how a consumer uses it. Point to concrete reuse candidates.

Follow explicit user and repository decisions. Surface consequential conflicts
instead of silently changing the architecture. Existing code shows current
behavior, not that every choice in it is good.

## Shape a spec

When called by [spec](../spec/SKILL.md), apply this guidance inside the spec.
Do not create a separate architecture document.

Keep the design understandable through a compact responsibility map, the
changed interfaces, and the consequential decisions. Use a small diagram,
folder tree, or consumer snippet when it says more than prose. Label proposed
interfaces as proposals.

Record only change-specific decisions and necessary exceptions. Link these
conventions once; do not repeat them in every spec or ask the human to approve
them again. Acceptance examples belong in the spec; task order and progress
belong in [graph](../graph/SKILL.md). Use [refine](../refine/SKILL.md) for an
unresolved consequential decision.

## Inspect an implemented change

- Identify the comparison: PR base and head, or branch head against the merge
  base of its target. Say whether staged, unstaged, or untracked changes count.
- Read the full diff, surrounding code, and consumers. Trace the affected
  request or data flow across layers.
- Compare with the agreed design and explain drift. Without a spec, state
  missing intent; do not invent requirements.
- Treat validation and review results as evidence with a revision and limits.
  A passing test or lint is not proof the behavior is correct.
- Reuse [audit](../audit/SKILL.md) findings. Keep discovered bugs visible with
  the exact lines.

## Required parts of a change summary

Every implemented-change summary, approval brief, final handoff, and opening
brief of an interactive review includes these four parts. Scale depth to the
change. Do not drop a part to save space.

### 1. Change snapshot

Facts from Git, placed after the outcome, so the human can judge scope before
reading about design.

- **Comparison:** branch or PR, base and head revisions, local changes included.
- **Size:** files changed and lines added/deleted. Separate production from
  tests when useful. Call out generated files, lockfiles, and formatting churn.
  Report untracked and binary files separately; do not invent counts.
- **Affected structure:** a compact tree of changed folders and files, each
  marked added, modified, moved (old → new), or deleted. Only affected paths.
  Group repetitive generated paths with a count. Explain new folders.
- **Where to look:** the most consequential files, plus a compare link or the
  exact local diff command for the stated scope.

Use verified values. If something cannot be verified, say so instead of
estimating.

### 2. Changed contracts as code

Prose about an interface is not reviewable. Show the real excerpts, chosen with
the matching reference's guidance.

- Every new or changed public contract: schemas, signatures, endpoints,
  UI-state types, props, ViewModel actions, navigation arguments, tables,
  config shape. Show before and after when the shape changed.
- One consumer example for the main new or changed interface.
- The excerpt behind any discussed design decision or departure from the plan.
- Exact lines for any reported bug or concern.

Use real code with a source link and line range. Trim with `// ...` and label
simplified examples. Keep each excerpt short, usually under 25 lines. If there
is no contract change, say so and show the most consequential changed excerpt
instead.

### 3. Test breakdown

Show two things at a glance: tests that protect nothing in this change, and
changed behavior with no test. "Tests added" and "all green" show neither.

1. List the behaviors this change adds or alters, including error paths and
   edge cases. Source: spec, ticket, acceptance examples, or the diff.
2. Map each added, modified, or deleted test to a behavior in a table: test,
   behavior, one-line assertion, status.
3. Flag mismatches both ways:
   - **Tests without a behavior:** cover unchanged code, duplicate an existing
     test, assert implementation details, or only exercise mocks. Recommend
     removal or say why they stay.
   - **Behaviors without a test:** name the gap, whether manual checks or
     existing tests cover it, and whether it should block integration.
4. State what ran: command, revision, environment, result. Separate unit,
   integration, UI or instrumented, and manual checks. Show failures and skips.

```text
Behavior                          Test                                    Status
Rejects negative quantity         orders/service.test.ts › negative qty    new
Returns 404 for unknown order     (none)                                   gap
Recalculates tax on update        orders/service.test.ts › tax             modified

Not tied to this change: orders/utils.test.ts › formats currency (unchanged helper)
```

If no tests changed, say so and whether that is appropriate. Do not present ad
hoc checks run during the session as a test suite.

### 4. Evidence and limits

What was validated, what independent review found, the revisions covered, and
what is unverified or blocked. Distinguish compilation, automated tests, and
manual checks, using the platform reference for what counts.

## Approval brief

Before a task integrates, summarize that proposed change for approval. Include
the task ID, the diff or commit, the compared trunk revision, and the four
required parts. Describe behavior as proposed until integration is verified.
Hand the decision back to `orchestrate`; a brief is not approval.

## Final handoff

At the end of `implement` or `orchestrate`, this is the final response. Cover
the whole session's combined diff and evidence, not only the last commit.

- **Outcome:** what users or systems can do now, with a before-and-after
  example. Separate completed from deferred scope.
- **How it works:** main components, their responsibilities, and the flow
  between them. Plain language for technical terms.
- **Interfaces and decisions:** changed contracts as code, tradeoffs, and
  departures from the plan with their effects.
- **Compatibility:** affected consumers, breaking behavior, migration or rollout.
- **Tests and evidence:** parts 3 and 4.
- **Human attention:** open decisions, plus links to the PR, spec, graph, and
  tickets. State whether the work is ready for review, merged, or released.

Group changes by outcome. Outside the snapshot, do not list every file. Deliver
the overview immediately; do not substitute a status line, a list of links, or
an offer to summarize later.

## Interactive review

Open with the brief above. Then walk through one consequential decision at a
time, most important first. For each: current design, practical effect,
alternatives, your recommendation, and the supporting excerpt.

- Separate a demonstrated problem from an agreed convention or a preference
  that needs the human's judgment. Do not manufacture concerns.
- Ask one focused question when needed, wait, and reuse the answer.
- Honor a request for a single written overview instead.

## Boundaries

- Report validation gaps plainly.
- [create-pr](../create-pr/SKILL.md) owns the PR description.
- Do not publish comments, edit code, or merge because a summary was requested.
  When fixes are authorized, use the established workflow and update the evidence.
- A summary never waives the approval gate before integration into trunk.
