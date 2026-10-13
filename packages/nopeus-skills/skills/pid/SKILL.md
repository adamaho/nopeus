---
name: pid
description: >-
  Use a closed-loop control model based on PID controllers for coding work and
  coding-agent prompts. Apply this when an agent needs to implement, debug,
  review, or plan a code change by defining the setpoint, sensors, error
  signal, smallest corrective action, validation loop, and stability rules.
  Emphasize integral feedback from accumulated errors over time and derivative
  feedback from predicted future errors. Also use it when asked to draft a
  reusable prompt or workflow that makes another AI coding agent measure
  correctness before changing code. For changes that affect a user interface,
  use this with the pid-ui-sensors skill.
disable-model-invocation: true
---

# PID

Turn coding work into a measured feedback loop. The goal is not a confident
patch; the goal is to reduce the error between desired behavior and current
behavior through small validated changes.

## Control Model

This skill is modeled after PID controllers. Use the control-system frame to
tune model output so measured error trends toward zero instead of relying on one
large open-loop generation.

Use these terms consistently:

- **Setpoint**: the observable behavior the change must produce.
- **Sensors**: the checks that measure whether the setpoint was reached.
- **Error signal**: the concrete gap between current and desired state.
- **Controller action**: the smallest code, test, prompt, or config change that
  reduces the error.
- **Stability rules**: constraints that prevent broad rewrites, unrelated
  changes, and oscillation.

### PID Terms

- **P / Proportional feedback**: correct the immediate measured error. Use the
  current compiler error, failing assertion, runtime exception, or observed
  behavior mismatch to choose the next patch.
- **I / Integral feedback**: account for accumulated error over time. Track
  repeated failure patterns, repo conventions, user preferences, and unresolved
  validation gaps so the agent stops reintroducing the same class of mistake.
- **D / Derivative feedback**: predict future error from the rate and direction
  of change. Before risky edits, identify likely failure modes introduced by the
  current patch trajectory, such as type drift, async races, public API changes,
  missing cleanup, user-facing regressions, or integration breakage.

The I and D terms are the important tuning tools for coding agents. Integral
feedback prevents recurring mistakes from surviving across turns. Derivative
feedback prevents overshoot by making the agent anticipate likely breakage
before it appears in validation.

### Normative Keywords

- Uppercase `MUST` = required
- Uppercase `MUST NOT` = prohibited
- Uppercase `SHOULD` = strongly recommended
- Uppercase `MAY` = optional
- Lowercase forms (`must`, `must not`, `should`, `may`) are explanatory and are
  not normative keywords.

## Workflow

Do these in order for implementation, debugging, and substantial code review
tasks. Keep each step proportional to the risk and size of the request.

### 1. Define The Setpoint

Before changing code, restate the desired outcome as observable acceptance
criteria.

Include the relevant parts only:

- user-visible behavior
- API behavior
- type behavior
- error and edge-case behavior
- performance, accessibility, or security requirements
- what MUST NOT change

If the user gave a vague target such as "fix this", "improve the UX", or "make
it cleaner", convert it into measurable behavior from the code, tests, bug
report, logs, screenshots, or reproduction steps by asking follow up questions for the information that is missing.

### 2. Identify The Sensors

Choose sensors before writing the patch. A sensor is any check that produces
concrete evidence about whether the setpoint was reached; it is not limited to
a test command.

Discover the project's native sensors instead of assuming a language, package
manager, directory layout, or test framework. Inspect the relevant sources of
truth, such as repository instructions, build files, task definitions, package
scripts, CI configuration, and nearby tests. Prefer documented commands and
existing conventions over commands invented from experience with other
projects.

Select only the categories that measure the requested change:

- **Static checks**: compiler, type checker, linter, formatter, or schema
  validation.
- **Behavioral checks**: focused unit, component, integration, end-to-end, or
  regression tests.
- **Runtime checks**: reproduction steps, logs, traces, requests, responses,
  database state, or generated artifacts.
- **Contract checks**: API schemas, compatibility tests, snapshots, public
  types, or serialized formats.
- **Human-facing checks**: screenshots, accessibility checks, interaction
  states, content review, or a concrete manual workflow.
- **Change-scope checks**: diff and repository-status review for unrelated
  edits, public API drift, risky cleanup, and accidental changes to user work.

For changes that affect a user interface, also load and apply the
`pid-ui-sensors` skill. Activate it based on the behavior being changed, not the
file's directory. Do not duplicate its specialized guidance here.

Use the cheapest relevant sensor during the feedback loop. A focused check
SHOULD run before a broad suite when it can provide a faster, clearer error
signal. Before completion, run the broader project-native checks justified by
the change's scope and risk. Do not run unrelated checks merely because they
exist, and do not claim a check is required without evidence from project
instructions or the setpoint.

Manual sensors MUST be concrete and reproducible. Record what was inspected or
performed and what result was observed. A visual glance or an unsupported claim
that the change "looks correct" is not a sensor.

Before writing or changing a test, evaluate whether it is necessary. A test is
justified when it directly measures behavior in the setpoint, reproduces a bug
that could realistically regress, protects a changed contract or edge case, or
is required by the project's established practice. First inspect existing tests
to determine whether they already provide that evidence.

Do not add a test merely because code changed, to increase coverage, to restate
the implementation, or when a cheaper existing sensor proves the result. Tests
for documentation, mechanical configuration changes, trivial wiring, or behavior
already covered elsewhere are usually unnecessary unless project instructions
require them. If the value of a proposed test is unclear, do not write it;
report the validation used instead.

If an important behavior has no sensor, identify the validation gap and suggest
a useful check. Add a small test, assertion, or diagnostic only when it is
within scope and passes the necessity test above. Do not invent project commands,
create broad evaluation harnesses, or add benchmark infrastructure unless the
user explicitly asks for them.

### 3. Measure The Current Error

Inspect the current implementation before patching. Use concrete evidence:

- failing test names and assertions
- compiler or linter errors
- runtime exceptions and stack traces
- incorrect observable state or behavior
- mismatched request or response shape
- missing edge cases
- unexpected side effects

Do not guess when a sensor can produce the error signal. If a sensor is too
expensive to run immediately, explain the cheaper evidence being used and the
command that should close the loop later.

### 4. Choose The Smallest Corrective Action

Make the smallest change that reduces the measured error.

Prefer:

- local changes over broad rewrites
- existing patterns over new abstractions
- existing dependencies over new dependencies
- clear types over `any`
- necessary behavior-focused tests over automatic coverage expansion
- preserving public APIs unless the setpoint requires an API change

Do not refactor unrelated code. Do not rewrite tests to match broken behavior.
Do not widen the task because adjacent code looks imperfect.

### 5. Validate And Loop

Run the selected sensors after the patch. If validation fails, do not start
over and do not switch to a larger rewrite by default.

Instead:

1. Read the exact failure.
2. Identify the new error signal.
3. Explain the likely cause in task-local terms.
4. Apply the smallest corrective patch.
5. Re-run the relevant sensor.

Repeat until the measured error is zero or the remaining uncertainty is clearly
identified.

### 6. Audit The Final State

After the setpoint is reached, audit only the changes made during this loop for
residue that mechanical sensors cannot prove.

Check for:

- duplicate logic
- redundant branches, guards, or fallback behavior
- unnecessary new abstractions
- temporary logs, comments, flags, or debugging code
- tests that assert implementation details instead of behavior

Remove only task-local residue. Do not refactor unrelated code or broaden the
scope after the setpoint is reached. Re-run the relevant sensors after cleanup.

## Stability Rules

- Treat vague instructions as low signal, not permission for broad changes.
- Keep controller gain low: patch against the observed error, not every possible
  improvement.
- Use integral feedback deliberately. Repository rules, user preferences,
  repeated failure modes, and previous validation gaps SHOULD tune the next
  patch so accumulated error trends down. Stale or unrelated history MUST NOT
  dominate the current setpoint.
- Use derivative feedback before risky edits. The agent SHOULD predict future
  error from the rate and direction of the current change, name likely failure
  modes, and guard against them before touching code.
- Stop and ask only when the setpoint cannot be inferred and a reasonable
  assumption would be risky.
- Preserve user changes already present in the working tree.

## Prompt Drafting

When the user asks for a prompt instead of an implementation, produce a prompt
that makes the target agent run the same feedback loop.

Use this structure:

```text
You are helping me make a small, production-quality code change.

Goal:
<what I want>

Setpoint / acceptance criteria:
<observable behavior, API behavior, type behavior, edge cases, and what must
not change>

Context:
<relevant files, APIs, types, logs, screenshots, examples, or reproduction
steps>

Sensors:
<typecheck, focused tests, integration tests, logs, diff review, specialized
sensor skills, or other checks that prove correctness>

Constraints:
<no new dependencies, public API limits, strict types, existing patterns,
performance limits, accessibility requirements>

Workflow:
1. Restate the setpoint.
2. Identify likely failure modes.
3. Pick the smallest corrective action.
4. Make the patch.
5. Run the selected sensors.
6. If a sensor fails, patch only against that error signal and re-run it.
7. Once sensors pass, audit only the changes made during the loop for duplicate
   or unnecessary code that mechanical sensors cannot prove, remove only
   task-local residue, and re-run relevant sensors.

Do not:
- Rewrite unrelated files.
- Introduce new dependencies unless explicitly required.
- Use broad refactors as the first corrective action.
- Change public APIs unless the setpoint requires it.
```

## Final Report

When finishing coding work, report:

- the setpoint that was targeted
- why the change was made and the problem it solves
- the files changed and the function signatures in the file that changed
- when test files are present, enumerate each test file with its section or
  `describe` names and every test case name
- the sensors run and their results
- any remaining risk, missing sensor, or validation that could not be run

Keep the report concise. The value is in measured proof, not a long narrative.
