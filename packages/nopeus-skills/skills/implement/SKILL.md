---
name: implement
description: >-
  Coordinate a software feature from idea to a validated PR ready for human
  review. Use for the full workflow: refinement, spec, graph, tickets, execution,
  and review. Use orchestrate for a ready spec and graph, or individual skills for
  focused planning and ticket requests.
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

Find existing specs, graphs, tickets, and PRs. Verify progress, then start at the
earliest incomplete stage. Reuse settled decisions and existing artifacts. Let
each skill investigate the details it needs.

## Choose models

Use the shared [model selection rules](../orchestrate/references/models.md) before
starting. Ask for any missing orchestrator, worker, and reviewer choices together;
reuse choices already supplied. Mixed models and providers are supported only
where available tools can run them.

The orchestrator leads the conversation and moves between stages. Pass model
choices, decisions, artifact links, and permissions to `orchestrate` without asking
for the same choices again.

## Connect the skills

Read each skill when needed and follow its rules. Move between authorized stages
without asking the user to invoke the next skill. Wait for answers to unresolved
questions and for permissions not already granted.

| Stage | Skill | Result |
| --- | --- | --- |
| Resolve the idea | [refine](../refine/SKILL.md) | Agreed behavior, scope, outcomes, and decisions needed for the spec. |
| Specify the change | [spec](../spec/SKILL.md) with [review](../review/SKILL.md) guidance | A concise agreement on behavior, architecture, public contracts, and acceptance examples. |
| Plan the work | [graph](../graph/SKILL.md) | Dependencies, PR groups, completion requirements, and a flowchart. |
| Create tracking | [create-ticket](../create-ticket/SKILL.md) | A parent for the spec and graph, plus one child per PR group. |
| Execute and verify | [orchestrate](../orchestrate/SKILL.md) | Implementation, independent reviews, validation, and a feature PR ready for human review. |
| Present the design | [review](../review/SKILL.md), through `orchestrate`'s handoff | A short brief and guided human walkthrough of the implemented design and consequential decisions. |

Let `orchestrate` manage implementation. It uses [create-pr](../create-pr/SKILL.md)
for smaller PRs and the feature PR.

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

- **Blocked:** preserve drafts and progress, explain what is missing, and ask for
  the tools, access, or destination details needed. Keep incomplete stages open.
- **Resuming:** let the relevant skill verify actual state before continuing.
- **Coordination:** keep one conversation with the user; workers and reviewers
  may use separate sessions.

## Hand off to the human

Before writing the final response, apply [review](../review/SKILL.md)'s written
handoff to the completed work across the session. This is a required workflow
stage, not an offer to review later. Use `orchestrate`'s implementation evidence and
validation results; confirm that its walkthrough reached the human rather than
assuming an internal agent review satisfied this step.

Make the final response understandable without opening code or earlier messages.
If a walkthrough was already delivered, give a concise recap instead of repeating
the full discussion. Include:

- The feature PR, parent and child tickets, and spec and graph links.
- The validated revision and target base, acceptance coverage, and review results.
- Remaining limitations or blockers, with links to detailed evidence.

PR links and check results support the explanation; they do not replace it.

Keep the handoff concise. Leave the feature PR open for human review and final
merge; ready for review does not mean the feature is complete.
