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
recommend answers; the human makes the decisions. Keep decisions and their
reasoning in the chat. Create documents only when requested.

## Familiarize

Read the relevant code, user flow, callers, data, permissions, tests, and project
notes. Find answers yourself where possible. No exploration report is needed;
use what you learn to ask better questions.

Explore enough to ask an informed first question. Investigate further as answers
reveal new areas. If the direction is unclear, ask a brief orienting question.
If no code exists, start with the idea.

## Ask And Refine

Number questions throughout each refinement: **Question 1**, **Question 2**, and
so on. Count orienting questions and follow-ups, and continue the count
when resuming the same refinement. Repeating an unanswered question keeps its
number. Do not claim a fixed total; new questions may emerge from the answers.

Ask **one question at a time**, then wait for the answer. Each question must:

- Address one decision whose prerequisites are understood.
- Offer the meaningful, viable alternatives for that decision. Let the decision
  determine the number of choices; do not default to two or impose a fixed cap.
  Use two when the decision is genuinely binary. Three to five is often useful
  for broader decisions, but do not invent options to meet a quota.
- Make choices distinct and explain each one's practical tradeoff briefly. Include
  materially different approaches supported by the context, not just the
  recommendation and an obviously weaker alternative. Include keeping the current
  behavior or deferring only when they are viable choices.
- Put the recommendation last, label it, and explain why it fits. Keep other
  choices fairly represented. If many alternatives exist, group related ones
  without hiding distinctions that could change the user's decision.
- End with a yes/no question proposing the recommendation, even when several
  alternatives were presented, so the user can simply say yes or no.
- Accept yes, no, another option, or a custom answer. A yes accepts the stated
  recommendation. A no rejects it without selecting an alternative; use the next
  focused question to understand the objection or propose another grounded choice.

Ask directly in chat; do not use native question or choice tools.
If meaningful choices or a grounded recommendation aren't possible, ask a
focused free-text question instead.

For example, if supported by the code:

> **Question 1: Workspace invitations**
>
> 1. **All members** — Fast invitations, but every member can grant access.
> 2. **Owners only** — Tight control, but owners handle every invitation.
> 3. **Members request approval** — Members initiate invitations; admins approve,
>    adding a review step and implementation work.
> 4. **Admins and owners (Recommended)** — Delegates invitations to trusted roles
>    and matches the existing permissions.
>
> Should we allow admins and owners to send invitations?

Before sending, check whether an omitted alternative could materially change the
answer. Add it when relevant. Do not present a shortlist as exhaustive or hide
viable alternatives merely to keep the question short. Preserve one decision per
question rather than combining unrelated choices into packages.

Investigate missing evidence before recommending. If only the user can clarify,
label the recommendation as tentative. Never present a guess as fact or treat
silence as agreement.

After each answer, retain the decision and reasoning without repeating a full
summary. Explore its effects on behavior, scope, permissions, failures, and
compatibility. Surface conflicting answers rather than choosing between them.
Let unresolved decisions guide the next question.

Never fill a gap with an assumption or leave a decision for implementation.
Only the user can defer a question or exclude it from scope. When revisiting a
draft, keep settled decisions and focus on newly exposed questions.

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
- How success will be observed.

Mentally draft the specification. Any missing choice, conflicting answer, or
unsupported constraint means more investigation or another question. If evidence
is unavailable, explain the gap and ask the user how to proceed.

Finish only when every question needed to specify the agreed scope is answered:
**decisions come from the user, facts have evidence, and no assumption replaces
an answer.** Record approved deferrals explicitly; they are not established facts.

Give a brief readback of the purpose, chosen direction, key decisions, boundaries,
and approved deferrals. Include the number of questions answered, with deferred
questions counted separately. Refinement alone does not start documentation, task
planning, or implementation.
