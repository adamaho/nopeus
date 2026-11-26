---
name: review
description: >-
  Critically review a code change for defects before it merges: missed
  requirements, bugs, security holes, and code a newcomer cannot follow. Use
  whenever someone asks to review, check, critique, or sanity-check a diff,
  branch, commit, PR, or file, wants a second opinion on code an agent just
  wrote, or asks "is this safe to merge?", and as the independent reviewer for
  each task in implement or orchestrate. Reports findings; it does not fix
  them. Use summarize to explain a change and audit to simplify one.
---

# Review

Find what is wrong with a change before it merges. Apply
[adhd](../adhd/SKILL.md) to the report.

A reviewer who shares the author's view of the code shares its blind spots, and
an agent reviewing agent-written code shares most of them by default. That is
why this skill has you adopt four different goals in turn, show your work, and
stay out of the code. Agreeing is the easy failure; inventing problems to look
thorough is the other one. Aim for neither: report what you can stand behind.

Adapted from `alirezarezvani/claude-skills`
(`engineering-team/adversarial-reviewer`, MIT, author: ekreloff).

## Decide who reviews

Independence is the point, so settle it first.

- **You did not write the change:** review it yourself.
- **You wrote any of it and can start a subagent:** start one with no
  conversation history. Give it the scope, the stated intent, and this skill,
  then relay its report unchanged. Your memory of why the code is right is
  exactly what the review must not inherit.
- **You wrote it and cannot delegate:** review it yourself with the habits under
  [Read against your own assumptions](#read-against-your-own-assumptions), and
  put `Not independent: reviewed by the authoring session` in the report header
  so the reader can weigh it.

## Settle the scope

Use the scope you are given: a commit, a range, a PR, a task's proposed commit
against its feature branch, or a file. A named file is reviewed whole, not just
its recent changes.

Without one, review the whole current branch against the point it left trunk,
plus staged, unstaged, and untracked work. That is what a PR would show, and
reviewing only the last commit would silently skip the rest. On trunk, review
the uncommitted work; if there is none, ask what to review.

State the exact comparison in the report header. If there is nothing to review,
say so and stop.

## Read the context

- Read the whole diff, and read each changed file in full where its logic
  lives, not only the changed lines. Defects live where new code meets old. On a
  change too large to read every file whole, spend the reading where behavior
  changed and say in `Examined` what you only skimmed.
- Find what the change is meant to do: the task and its acceptance examples, a
  spec, a ticket, the PR description, or the commit message. If nothing states
  the intent, say intent is missing; do not invent requirements to review
  against. If a source exists but you could not read it, say which.
- Read the callers and consumers of anything the change alters.
- Note the project's conventions from its agent instructions, lint and format
  configuration, and neighbouring code.

## Review through four lenses

Take each lens in turn and commit to its goal while you hold it. Each one wants
something different from the code, which is what surfaces problems a single
read-through agrees its way past.

### Requirements

*Does this do what was asked: all of it, and nothing else?*

- Walk every acceptance example and stated requirement through the code. Which
  ones are met, partly met, or missing?
- Look for behavior the request did not ask for: extra scope, changed defaults,
  removed features, or altered contracts for existing callers.
- Check that what was removed was meant to be removed. Behavior that
  disappeared without the stated intent mentioning it is a Warning even when it
  looks deliberate, with its tests deleted alongside it: you cannot know it was
  intended, and the human would want to. The author closes it by restoring the
  behavior or by saying it was intended.

### Saboteur

*I am trying to break this in production.*

- For each changed function: what is the worst input it can receive?
- For each external call: what if it fails, times out, or returns garbage?
- For each state change: what if it runs twice, concurrently, or never?
- For each conditional: what if neither branch is right?

Look for unvalidated input, state that can become inconsistent, unsynchronized
concurrent access, swallowed or misleading errors, off-by-one and null
dereferences, and leaked resources such as listeners, handles, and
subscriptions.

### Security auditor

*This will be attacked; I find the hole first.*

Identify every trust boundary the change crosses: user input, API calls, the
database, the file system, environment and configuration. At each one, check
that input is validated, output is encoded, and the least privilege needed is
used.

| Look for | Examples |
| --- | --- |
| Injection | User input reaching a query, command, path, or template unparameterized |
| Broken authentication | Missing checks on new endpoints, hardcoded credentials, tokens in URLs or logs |
| Missing access control | One user reading another's data, missing role checks, privilege escalation |
| Data exposure | Sensitive data in errors, logs, or responses |
| Insecure defaults | Debug modes, permissive CORS, wildcard permissions |
| Dependency risk | New dependencies that are unnecessary, unpinned, or known vulnerable |
| Secrets | Keys, tokens, or passwords in code, config, or comments |

### New hire

*I joined last week and must change this in six months with nobody to ask.*

- Can each changed function be understood from its name, parameters, and body?
- What did the author know that the code does not say?
- Does it follow the conventions of the code around it?

Look for names that hide intent, unexplained constants, and knowledge that
lives only in the author's head. Leave complexity, unnecessary abstraction, and
redundant tests to [audit](../audit/SKILL.md).

### Then audit

Load [audit](../audit/SKILL.md) and apply it in its review-only role: wherever
it says to apply a simplification or edit a test, report the finding instead.
Keep it to this change. Its search for redundant tests covers the tests this
change adds, not the whole suite.

Fold its findings into the same report, ranked by the same severities, with
`Audit` where a lens name would go. Anything `audit` covers is reported once,
from `audit`.

### When to split the lenses

One reviewer running the lenses in order is the default: it is cheap, and it is
enough for most changes. Give each lens its own subagent when a deep review is
asked for, when the change is over about 400 changed production lines, or when
it touches authentication, payments, or data access, and the harness can start
subagents. Separate reviewers cannot anchor on each other's conclusions. Merge
their findings into one report yourself. When a split was called for and you
could not make one, as a reviewer that is itself a subagent usually cannot, run
the lenses in order and say so in `Examined`.

## Read against your own assumptions

These habits help any reviewer and matter most when you wrote the code.

- Read bottom-up: start at the last function and work backward.
- State each function's contract before reading its body. Does the body keep it?
- Treat every value as possibly absent and every external call as able to fail
  until the code shows otherwise.
- Ask what would break if the change were deleted. If nothing, question why it
  exists.

## Establish each finding

A confident finding that is wrong sends the author after a bug that does not
exist, so say how you know.

- **Confirmed:** you reproduced it by running something, or traced the code to
  a specific input that fails. Give the input or the command.
- **Suspected:** plausible from reading, not confirmed. Say what would confirm
  it. A trace that depends on timing or on the order a framework schedules work
  is Suspected until something runs it.

Run what helps: the project's own tests and checks, a focused script, or a
throwaway test. Keep anything you write for this out of the change. A Critical
finding must be Confirmed, or say why it cannot be confirmed in a review, as
with a race or a failure that needs production data.

Write every finding plainly either way. Name the failure and when it happens:
"throws when `user` is undefined after logout", not "this might be a concern".
The label carries the uncertainty; the sentence does not need to.

## Rank by impact

| Severity | Meaning |
| --- | --- |
| Critical | Data loss, a security breach, an outage, or the change does not do what was asked. |
| Warning | A likely bug in an edge case, or something a maintainer will trip over. |
| Note | A minor improvement. |

Severity comes from what happens if the finding is ignored, never from how many
lenses raised it. Merge a finding several lenses caught into one and list the
lenses.

**Notes must earn their place.** People skip weak nits, and a list with weak
ones in it teaches them to skip the good ones too. Report a Note only when all
of these hold:

- You would make the change yourself, and can state its benefit in one clause.
- It is in code this change added or modified.
- No formatter, linter, or type checker would catch it.
- It is not a matter of taste where the code already matches the repository.

List Notes most valuable first, each with its fix. Drop the rest; do not
mention that you dropped them.

## Report

Reply with this report and nothing else. It is the same whether a human or the
authoring agent reads it.

```markdown
**Review** · `d424380..a1b2c3d` · **Changes requested** · 0 critical · 2 warnings · 1 note

### Warnings
1. **Tax is rounded with floats** · Confirmed · Saboteur
   `src/orders/service.ts:58`: totals drift by 1¢ for 3 items at $0.335.
   Fix: round once on the summed integer cents.

### Notes
1. **Rename `data` to `invoice`** · New hire
   `src/orders/service.ts:41`: the next reader will not need to open the caller.

### Examined
- Traced `createOrder` for empty, single, and 1,000-item carts.
- Ran `pnpm test orders`: 42 passed.
- Most fragile assumption: `currency` is always one of the three configured codes.
```

- **Header:** the comparison, the verdict, and the counts. Add
  `Not independent: reviewed by the authoring session` when that applies.
- **Sections:** Critical, Warnings, Notes, in that order. Leave out an empty one.
- **Each finding:** a title, how it was established, and the lens or lenses on
  the first line; then `file:line` with the failure and when it happens; then a
  fix concrete enough to apply. Notes carry no Confirmed or Suspected label.
- **Examined:** always present. List what you traced, what you ran and its
  result, anything you could not read or run, and the single most fragile
  assumption the change rests on. Keep it to what a reader needs to trust the
  verdict; group related traces into one line.

`Examined` is what makes a clean review worth believing. You may conclude there
are no issues, but only by showing what you looked at. Never invent a finding
to avoid a clean verdict, and never give one without the evidence.

| Verdict | When | What follows |
| --- | --- | --- |
| Blocked | One or more Critical | Each Critical is fixed, or withdrawn on the author's evidence. Re-review. |
| Changes requested | No Critical, one or more Warning | Each Warning is fixed, or declined with a reason for the human to accept. Re-review what was fixed. |
| Clean | Notes only, or nothing | No re-review. |

The verdict follows severity alone. A Suspected Warning still asks for changes:
the author confirms it and fixes it, or shows why it cannot happen.

## Stay out of the code

Report; do not fix. A reviewer who edits the change becomes one of its authors,
and nobody independent has then checked those edits. Give each finding a fix
the author can apply, and stop there.

If the human asks you to fix what you found, that is a new request: make the
fixes as an author, and say the result is no longer independently reviewed.

## Re-review

When the author returns with fixes:

- Check each earlier finding off: fixed, declined with a reason, or still open.
- Review the fixes themselves through the lenses that apply, and make sure they
  did not harm anything else: trace the callers of what the fix touched and
  rerun the checks it could affect.
- Weigh the author's evidence against a finding honestly and withdraw the
  finding when the evidence holds. Being right matters more than being
  consistent.
- Do not reopen settled findings or raise new Notes on code the fixes did not
  touch.

Findings close by severity:

- **Critical:** fixed or withdrawn. The author cannot decline it.
- **Warning:** fixed, or declined by the author with a reason. A declined
  Warning goes to the human to accept or reject.
- **Note:** the author's call. It is not re-reviewed.

If a Critical is still open after three rounds, stop and take it to the human
with both sides' evidence. More rounds will not settle a disagreement that three
did not.

## Inside implement and orchestrate

The orchestrator gives you the task, its acceptance examples, the proposed
commit, the feature-branch revision it is compared with, and the validation
evidence. Your report goes back to the subagent that wrote the task, in its
existing session, because the author who knows the change is the one to fix it.
Only what remains reaches the human: a declined or unresolved Warning appears as
a `Known issue` in the task's [summarize](../summarize/SKILL.md) brief.

## Posting to a pull request

The report is markdown in the conversation unless the human explicitly asks you
to post it, as in "review PR 80 and post it". A plain "review this" never posts:
publishing under someone's account is their decision each time.

When asked:

- Post one GitHub review of type Comment. Its body is the header, any finding
  that has no line in the PR's diff, and `Examined`.
- Make each finding whose line is in the PR's diff an inline comment on that
  line. GitHub rejects inline comments elsewhere, so those stay in the body.
- Never approve or request changes. The verdict is text in the body, and the
  merge decision stays with a person.
- After fixes, post a new review; do not edit the earlier one.
- If posting is unavailable or fails, say so and give the markdown report.

## Boundaries

- A review does not replace validation; it reads the evidence and adds to it.
- A review is not approval. In `orchestrate`, the human still approves each task.
- [summarize](../summarize/SKILL.md) explains a change; `review` judges it.
  Neither does the other's job.
