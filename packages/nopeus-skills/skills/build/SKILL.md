---
name: build
description: >-
  Coordinate a software feature from idea to a validated PR ready for human
  review. Compose refinement, spec, graph, optional tickets, execution,
  and a detailed implementation summary. Use execute for a ready spec and graph,
  or individual skills for focused planning and ticket requests. Builds without tickets by default;
  create tracking only when requested.
---

# Build

Take an idea through to a reviewed, validated feature PR in one conversation,
finishing one reviewable slice at a time.
Connect the focused skills below so the user does not have to invoke each one.
Apply [adhd](../adhd/SKILL.md) throughout.

## Scope and permissions

- An end-to-end request authorizes planning artifacts, parent and child tickets,
  branches, commits, pushes, PRs, progress updates, and smaller PR merges into
  the feature branch, within the agreed plan.
- Reuse supplied destinations. Ask for missing repository or tracker details
  before writing there. Respect permissions and explicit user limits.
- Stop before the final feature merge. Deployment and release are outside scope.
- Reading or discussing this skill does not start execution. Requests for an
  individual skill stay within that skill unless the user asks to continue.

## Choose ticket mode

Build without tickets by default. When the user asks to "build with tickets",
include `create-ticket` and use their existing tracker and destinations. Record
the choice with progress and retain it on resume; pass it to `graph`, `execute`,
and any delegates.

In no-ticket mode:

- Skip `create-ticket` and the graph-to-ticket mapping entirely. Do not draft,
  create, or update parent or child tickets, including existing tickets.
- Do not ask for a tracker, credentials, ticket IDs, or ticket destinations.
  Existing tickets can be read as source context without being changed.
- Keep the canonical spec, graph, decisions, progress, PR links, and validation
  evidence in the requested local files or repository scratch convention. If no
  location is supplied, keep them together under `.scratch/specs/`, ensuring the
  directory is ignored before writing, as `spec` requires.
- Keep all other stages, slice sizing, review, summaries, and merge boundaries.
  Missing tracker access never blocks a build in this mode.

Ticket requirements elsewhere in this workflow apply only in ticket mode. Switch
modes only when the user requests it; do not create tickets retroactively merely
because tracker access becomes available.

## Choose the starting stage

Find existing specs, graphs, tickets, and PRs. Verify progress, then start at the
earliest incomplete stage. Reuse settled decisions and existing artifacts. Let
each skill investigate the details it needs.

## Choose models

Use the shared [model selection rules](../execute/references/models.md) before
starting. Ask for any missing orchestrator, worker, and reviewer choices together;
reuse choices already supplied. Mixed models and providers are supported only
where available tools can run them.

The orchestrator leads the conversation and moves between stages. Pass model
choices, decisions, artifact links, and permissions to `execute` without asking
for the same choices again.

## Connect the skills

Read each skill when needed and follow its rules. Move between authorized stages
without asking the user to invoke the next skill. Wait for answers to unresolved
questions and for permissions not already granted.

| Stage | Skill | Result |
| --- | --- | --- |
| Resolve the idea | [refine](../refine/SKILL.md) | Agreed behavior, scope, outcomes, and decisions needed for the spec. |
| Specify the change | [spec](../spec/SKILL.md) with [summarize](../summarize/SKILL.md) guidance | A concise agreement on behavior, architecture, public contracts, and acceptance examples. |
| Plan the work | [graph](../graph/SKILL.md) | Dependencies, PR groups, completion requirements, and a flowchart. |
| Create tracking, only when requested | [create-ticket](../create-ticket/SKILL.md) | A parent for the spec and graph, plus one child per PR group. |
| Execute and verify | [execute](../execute/SKILL.md) | Implementation, independent reviews, validation, and a feature PR ready for human review. |
| Summarize the implementation | [summarize](../summarize/SKILL.md), through `execute`'s handoff | A mandatory detailed written breakdown of changes, components, interfaces, public APIs, data structures, decisions, and validation. |

Use these stages progressively. First agree on the feature direction, shared
contracts, and an outline of likely PRs with size estimates. Fully refine and
specify only the next slice. A slice may complete one layer or a narrow end-to-end
behavior; it must have a bounded outcome and feasible verification.

Let `execute` manage one active implementation slice at a time. After it is
implemented, validated, independently reviewed, integrated into the feature branch,
and summarized to the human, revisit `refine`, `spec`, and `graph` for the next
slice using what was learned. Keep settled feature decisions and model choices.
Later-slice details may remain open unless they constrain the current slice.
Use [graph](../graph/SKILL.md)'s PR sizing rules, including agreed exceptions.
Do not introduce a new approval checkpoint between slices when the next work is
already authorized and its decisions are settled.

`execute` uses [create-pr](../create-pr/SKILL.md) for smaller PRs and the feature PR.

In ticket mode, use the spec's local draft as working material. Publish the full
spec and graph in the chosen parent ticket or linked document. Use spec-based
ticket descriptions to preserve the necessary detail. Reuse existing tickets and
keep the published artifacts current; individual nodes remain graph entries. In
no-ticket mode, maintain the local spec and graph instead.

When a stage reveals unanswered questions, use `refine`, then update the affected
spec and graph, plus tickets in ticket mode. Continue only after the decisions
needed for that work are settled. Keep one active slice; do not switch to another implementation
slice while blocked unless the user chooses to reorder the work.

## Preserve progress

Keep decisions, model choices, artifact links, ticket mode, current stage,
evidence, blockers, and next work alongside the graph, or with the spec before
a graph exists.
Use existing conversation decisions until there is a document to hold them.

- **Blocked:** preserve drafts and progress, explain what is missing, and ask for
  the tools, access, or destination details needed. Keep incomplete stages open.
- **Resuming:** let the relevant skill verify actual state before continuing.
- **Coordination:** keep one conversation with the user; workers and reviewers
  may use separate sessions.

## Summarize and hand off to the human

Every completed implementation must include
[summarize](../summarize/SKILL.md)'s detailed written implementation summary in
the final response. This is a mandatory stage of `build`, delivered without
another user request. Use `execute`'s implementation evidence and validation
results across the entire session. Independent code review, earlier walkthroughs,
progress updates, and PR links do not replace this summary.

Explain the changes, component responsibilities and flow, interfaces and public
APIs, data structures and state, and consequential decisions using `summarize`'s
coverage guidance. Make the result understandable without opening code or earlier
messages. Include relevant PR, ticket, spec, and graph links, the validated
revision and target base, acceptance coverage, review results, and limitations.

If execution stops partially complete or blocked, summarize completed changes and
identify unfinished scope and blockers. Do not imply the implementation is ready.

Keep the summary readable without sacrificing technical detail. Leave the feature
PR open for human review and final merge; ready for review does not mean the
feature is complete.
