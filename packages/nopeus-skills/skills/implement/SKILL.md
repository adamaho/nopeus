---
name: implement
description: >-
  Coordinate a software feature from an idea or existing work through refinement,
  specification, dependency planning, tickets, implementation, and review. Use
  when the user wants the end-to-end journey in one conversation, ending with a
  feature PR ready for human review. Use execute for standalone execution
  of a ready spec and graph; focused planning and ticket requests stay with their
  respective skills.
---

# Implement

Take an idea through to a reviewed, validated feature PR in one conversation.
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

## Choose the starting stage

Identify existing specs, graphs, tickets, and PRs. Enter at the earliest incomplete
stage, verifying progress before skipping work. Reuse settled decisions and
existing artifacts. Let each skill perform its own investigation.

## Choose models

Use the shared [model selection rules](../execute/references/models.md) before
starting. Ask for any missing orchestrator, worker, and reviewer choices together;
reuse choices already supplied. Mixed models and providers are supported only
where available tools can run them.

The orchestrator leads the conversation and stage transitions. Pass model choices,
agreed decisions, artifact links, and permissions into `execute`. Do not ask
for the same choices again when entering implementation.

## Connect the skills

Read and apply each skill when needed. Follow its content and quality rules.
The end-to-end request authorizes moving between stages: do not ask the user to
manually invoke the next skill or reconfirm an already authorized transition.
Wait for unresolved decisions and permissions not already granted.

| Stage | Skill | Result |
| --- | --- | --- |
| Resolve the idea | [refine](../refine/SKILL.md) | Agreed behavior, scope, outcomes, and decisions needed for the spec. |
| Specify the change | [spec](../spec/SKILL.md) | Behavior, architecture, contracts, and acceptance examples. |
| Plan the work | [graph](../graph/SKILL.md) | Dependencies, PR groups, completion requirements, and a flowchart. |
| Create tracking | [create-ticket](../create-ticket/SKILL.md) | A parent for the spec and graph, plus one child per PR group. |
| Execute and review | [execute](../execute/SKILL.md) | Implementation, independent reviews, validation, and a feature PR ready for human review. |

During execution, `execute` uses [create-pr](../create-pr/SKILL.md) for smaller
PRs and the feature PR. Delegate execution mechanics to `execute`; do not
maintain a second set of implementation instructions here.

Use the spec's local draft as working material. Publish the full spec and graph
in the chosen parent ticket or linked document. Use spec-based ticket descriptions
to preserve the necessary detail. Reuse existing tickets and keep the published
artifacts current; individual nodes remain graph entries.

When a stage reveals unanswered questions, use `refine`, then update the affected
spec, graph, and tickets. Continue only after the decisions needed for that work
are settled. Independent work can continue while another part is blocked.

## Preserve progress

Keep decisions, model choices, artifact links, current stage, evidence, blockers,
and next work alongside the graph, or with the spec before a graph exists.
Use existing conversation decisions until there is a document to hold them.

If tools, access, or destination details are missing, preserve drafts and progress,
explain the blocker, and ask for what is needed. Do not claim incomplete stages
are complete. On resume, let the relevant skill verify actual state before
continuing. One conversation coordinates the work; workers and reviewers may
use separate sessions.

## Hand off to the human

Use `execute`'s final validation and review results. Return:

- The feature PR, parent and child tickets, and spec and graph links.
- The validated revision and target base, acceptance coverage, and review results.
- Remaining limitations or blockers, with links to detailed evidence.

Keep the handoff concise. Leave the feature PR open for human review and final
merge; ready for review does not mean the feature is complete.
