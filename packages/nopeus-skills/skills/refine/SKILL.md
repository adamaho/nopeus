---
name: refine
description: >-
  Refine software ideas through codebase exploration and one question at a time.
  Use when asked to sharpen an idea, clarify its direction, or resolve questions
  in a draft. The result is agreed intent and decisions in the chat.
---

# Refine

Read and apply [adhd](../adhd/SKILL.md) before communicating with the user.

Start from the user's idea, even a single sentence. Investigate facts and
recommend answers; the human settles consequential decisions about the desired
outcome, scope, behavior, and contracts. Reuse repository conventions and leave
routine implementation choices to the implementing agent within those boundaries.
Keep decisions and their reasoning in the chat. Create documents only when requested.

## Familiarize

Read the relevant code, user flow, callers, data, permissions, tests, and project
notes. Find answers yourself where possible. No exploration report is needed;
use what you learn to ask better questions.

Explore enough to ask an informed first question. Investigate further as answers
reveal new areas. If the direction is unclear, ask a brief orienting question.
If no code exists, start with the idea.

## Refine one slice at a time

For a larger change, first agree on overall behavior, scope, important shared
contracts, and likely dependencies. Then resolve the detail needed for the next
slice. A slice is a bounded, independently verifiable change that fits a reviewable
PR. It may complete one layer or a narrow behavior across layers; do not require
end-to-end work when a database, server, or frontend boundary is clearer.

Keep later slices as an outline with explicit open decisions. Their details need
not be settled before the current slice starts unless they constrain its contracts
or feasibility. This is staged refinement, not permission to guess future behavior.
Revisit the next slice after the current one is implemented, verified, reviewed,
and summarized. Use the completed work as evidence for the next refinement.

## Ask And Refine

Number questions throughout each refinement: **Question 1**, **Question 2**, and
so on. Count orienting questions and follow-ups, and continue the count
when resuming the same refinement. Repeating an unanswered question keeps its
number. Do not claim a fixed total; new questions may emerge from the answers.

Ask **one question at a time**, then wait for the answer. Each question must:

- Address one decision whose prerequisites are understood.
- Offer 2–3 short choices, with the recommendation last. Label it and explain why.
- End with a yes/no question proposing the recommendation.
- Accept yes, no, another option, or a custom answer. A no rejects the
  recommendation; it does not select an alternative.

Ask directly in chat; do not use native question or choice tools.
If meaningful choices or a grounded recommendation aren't possible, ask a
focused free-text question instead.

For example, if supported by the code:

> **Question 1: Workspace invitations**
>
> 1. **All members** — Easier invitations, but broader permissions.
> 2. **Workspace admins (Recommended)** — Matches the existing permissions.
>
> Should we limit invitations to workspace admins?

Investigate missing evidence before recommending. If only the user can clarify,
label the recommendation as tentative. Never present a guess as fact or treat
silence as agreement.

After each answer, retain the decision and reasoning without repeating a full
summary. Explore its effects on behavior, scope, permissions, failures, and
compatibility. Surface conflicting answers rather than choosing between them.
Let unresolved decisions guide the next question.

Never replace a consequential decision with an assumption. Ask when alternatives
would change agreed behavior, public contracts, permissions, compatibility, or
other material constraints. Do not ask the human to choose private helper names,
routine coding details, or conventions the repository already settles.
Only the user can defer a required decision or exclude it from scope. When
revisiting a draft, keep settled decisions and focus on newly exposed questions.

## Parallel Investigation

**Only the conversation lead asks the human questions.** Subagents investigate
and report to the lead. Include these instructions in every subagent assignment:

- Never ask the human questions or use tools that request user input.
- Return evidence, code locations, unanswered questions, conflicts, and assumptions.
- Never decide for the user or implement changes.
- If blocked on an answer, tell the lead and continue only independent investigation.

Delegate bounded, independent questions when useful: explore separate code
areas, check edge cases, or look for missing decisions. Give each investigator
the relevant decisions and evidence needed. Work sequentially when delegation
is unavailable or adds little value.

The lead tracks open questions, reconciles findings with the latest answers,
and shares decisions with affected investigators. Recheck findings when their
assumptions change. Avoid duplicate work. Wait for evidence a question needs;
ask an independent question while waiting when possible.

Collect outstanding findings before finishing. Unfinished investigation does
not count as a resolved question.

## Know When To Finish

Be able to explain:

- The problem, users, and desired outcome.
- Expected behavior, concrete examples, and edge cases.
- Scope, constraints, and user-approved exclusions or deferrals.
- How success will be observed, including realistic failure cases that matter.
- Which implementation choices remain with the agent and when it must return
  to the human for a decision.

Mentally draft the specification. A missing consequential decision, conflicting
answer, or unsupported constraint means more investigation or another question.
Investigate uncertain technical feasibility with focused code inspection or a
bounded experiment when authorized; a user preference cannot establish a technical
fact. If evidence is unavailable, explain the gap and its effect on readiness.

Finish only when every question needed for the current slice and the shared
agreement it depends on is answered:
**consequential decisions are agreed, facts have evidence, and no assumption
replaces a needed answer.** Record approved deferrals explicitly; they are not
established facts. Routine implementation choices do not prevent readiness.

Give a brief readback that can feed directly into `spec`: the purpose, chosen
direction, agreed decisions and constraints, relevant code evidence, agent-owned
choices, and approved deferrals or remaining blockers. Preserve reasons where
they constrain implementation; do not require a new document. Include the number
of questions answered, with deferred questions counted separately. Distinguish
later-slice decisions awaiting refinement from blockers for the current slice.
Refinement alone does not start documentation, task planning, or implementation.
