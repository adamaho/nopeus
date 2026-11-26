---
name: summarize
description: >-
  Brief a human on a code change as one fixed-format HTML page built by a
  bundled script: file tree with line counts, production versus test lines,
  public interface diffs, test summary, validation, and screenshots. Use
  whenever someone asks to summarize, explain, or walk through a diff,
  branch, commit, or PR, and for every approval brief and final handoff in
  implement or orchestrate, even when they only ask "what changed?". Also
  supplies design guidance when shaping specs. To find defects in a change, use
  review.
---

# Summarize

Help the human evaluate a design or change without reading the full diff. Apply
[adhd](../adhd/SKILL.md) to everything you write.

There are two jobs here. For a design that has no diff yet, see
[Shape a spec](#shape-a-spec). For any change that exists as code, build a
[brief](#brief-a-code-change).

## Establish the context

Identify the change, relevant code, consumers, repository conventions, and
agreed decisions. Read the reference that matches the work:

- [React](references/react.md): components, props, routing, client data.
- [Android](references/android.md): screens, UI state, navigation, lifecycle,
  data access, Compose or Views.
- [Backend and APIs](references/backend.md): domains, repositories, services,
  HTTP contracts, Effect composition.

Each reference ends with what to show and what counts as evidence on that
platform. Use it to choose what goes in the brief; priorities differ by platform.

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

## Brief a code change

Every summary of implemented code is the same page: an approval brief, a final
handoff, or an answer to "what changed on this branch?". The human reviews many
of these and learns where to look; a layout that shifts between briefs costs
them that. So you do not write the page. A bundled script builds it from Git
and from a small data file holding the parts that need your judgement.

The script owns the layout, the file tree, every line count, and every code
excerpt, which it cuts from the real diff. That is what lets the human trust
the numbers without checking them. You own the outcome, which interfaces
matter, what the tests protect, and what needs attention.

### 1. Understand the change

- Settle the comparison: the base revision, the head, and whether uncommitted
  work counts. A final handoff covers the whole session's range, not the last
  commit.
- Read the full diff, surrounding code, and consumers. Trace the affected
  request or data flow across layers.
- Compare with the agreed design. Without a spec, say intent is missing in a
  `design` bullet; do not invent requirements.
- Reuse [audit](../audit/SKILL.md) findings.

### 2. Write the data file

Write JSON to a scratch or temp folder, not into the repository. Every field
below is required unless marked optional; an empty list is an answer, a missing
field is not.

```json
{
  "kind": "approval",
  "task": "T3",
  "base": "dev",
  "head": "HEAD",
  "uncommitted": false,
  "outcome": ["Users can delete a receipt from the list; the row disappears without a reload."],
  "interfaces": [
    {
      "title": "`createOrder`",
      "file": "src/orders/service.ts",
      "lines": "42-44",
      "note": "Creates an order; callers must now pass the currency."
    }
  ],
  "design": ["**Departure:** spec defaulted currency to USD; made it required to avoid silent mispricing."],
  "tests": {
    "summary": ["New unit tests cover quantity validation and tax recalculation on update."],
    "gaps": ["Unknown order returning 404 has no test."]
  },
  "validation": {
    "revision": "a1b2c3d",
    "checks": [
      { "check": "Unit", "command": "pnpm test orders", "result": "Pass" },
      { "check": "E2E", "result": "Not run", "detail": "no local stack" }
    ]
  },
  "ui": { "visible": false },
  "attention": [{ "tag": "Breaking", "text": "`createOrder` now requires `currency`; 2 callers updated." }]
}
```

Text fields accept `` `code` `` and `**bold**` only. Keep each to one line.

| Field | What to put there |
| --- | --- |
| `kind` | `approval` before a task integrates, `handoff` for a whole session's outcome, `summary` otherwise. |
| `task` | Optional. The task ID when the caller gave one. |
| `base`, `head` | Revisions to compare. `head` defaults to `HEAD`. The script compares from their merge base. |
| `uncommitted` | `true` to include staged, unstaged, and untracked work. Only with `head` at `HEAD`. |
| `outcome` | One to three bullets, each something a user or caller can now do. Not how it works. |
| `interfaces` | Every new or changed public interface. See below. `[]` when none changed. |
| `design` | Optional. One-line bullets for consequential decisions and departures from the plan. |
| `components` | Optional. React and other UI trees. See below. |
| `tests` | What the tests protect, and what they do not. See below. |
| `validation` | What ran and on which revision. See below. |
| `ui` | Screenshots for visible changes. See below. |
| `attention` | Everything the human must act on or know. `[]` renders as "None". |
| `graph` | Optional. Task graph position. See below. |
| `classify`, `generated` | Optional corrections to the file tree. See below. |

**Interfaces.** Prose about an interface is not reviewable, so the page shows
the real diff. Point at it; do not retype it.

- `file` and `lines` name the range in the head version, such as `"42-44"` or
  `"12-14,30"`. For an interface that was deleted, give `oldLines` instead.
- The script shows a diff only where a diff says something, so choose the range
  for what you want the human to see:

  | The range holds | Shown as |
  | --- | --- |
  | Changed lines next to lines that survived | Diff, labelled Changed |
  | Only added lines, as in a new type or function | Plain code, labelled New |
  | Only removed lines | Plain code, labelled Removed |
  | No changed lines, as in a usage example | Plain code, labelled Unchanged |

  For a changed signature, include the lines around the change so the diff has
  context. For a new interface, select just its signature or type; it is not a
  diff, so do not pad the range to make it look like one.
- Select the smallest range that shows the contract: function signatures,
  exported types and schemas, endpoint definitions, props, UI-state types,
  navigation arguments, table definitions, config shape. Leave implementation
  bodies out unless the body is the contract, as in a declarative rule or
  schema. New types count; they show as all-added lines.
- `title` names the interface the way a caller would: `` `createOrder` ``,
  `` `ReceiptListProps` ``, `DELETE /receipts/:id`. It heads the entry on the
  page, so the human can scan the list of interfaces without reading code.
- `note` is one sentence on what the interface is for and what changed for its
  callers.
- Show few. A reader gets through about ten entries, so on a large change keep
  the interfaces a caller would feel and name the rest in one `design` bullet.
  Twenty entries of equal weight hide the three that matter.
- Use the matching platform reference to decide which contracts matter. When
  none fits, as with a library, CLI, lint rule, or config package, the contract
  is whatever a consumer depends on: exported names, rule or command IDs,
  option and config shapes, flags, and user-facing messages.

**Components.** When a change touches UI components, add their structure so the
human can judge ownership and composition without opening files:

```json
"components": {
  "tree": [
    {
      "name": "ReceiptPage",
      "status": "M",
      "owns": "data: `useReceipt`, `useDeleteReceipt`",
      "children": [
        { "name": "ReceiptLayout", "status": "·", "owns": "slots: toolbar, children" },
        { "name": "ReceiptList", "status": "M", "owns": "render only, emits `onSelect`" }
      ]
    }
  ],
  "usage": { "title": "`ReceiptPage` composition", "file": "src/receipts/receipt-page.tsx", "lines": "31-33" }
}
```

`status` is `A`, `M`, `D`, or `·` for an unchanged component shown only to
connect changed ones. `owns` says what the component is responsible for: route
params, data, state, or render only. `usage` points at one real snippet showing
the main composition.

**Tests.** Keep this high level; the human wants to know what is protected and
what is not, not a list of test cases.

- `summary` is one to three bullets on what the tests protect, grouped by
  behavior, such as "covers validation and the error responses". When no
  behavior changed, say that instead.
- `gaps` lists each changed behavior that no test covers, one line each. Check
  error paths and edge cases before writing `[]`; it renders as "No known gaps".
- Mention changed tests that protect nothing in this change only when they are
  worth removing.

**Validation.** List every check the repository expects, including the ones
you did not run. A missing row reads as "not applicable"; a `Not run` row with
its reason lets the human decide whether that matters.

- `result` is `Pass`, `Fail`, or `Not run`. `Fail` and `Not run` need `detail`.
- `command` is the exact command, or a short description for a manual check.
- `revision` is the commit the checks ran on, or `"working tree"`. The page
  flags checks that ran on a different revision than the brief covers, because
  they do not vouch for it. Rerun them on the covered revision when you can; for
  a commit that is not checked out, a temporary worktree or `git archive` export
  works without touching the working tree.
- A check that ran somewhere else, such as CI on a PR head, takes its own
  `"revision"` on that row. CI that ran on the exact commit the brief covers is
  the strongest evidence there is: record it as a normal row, and do not add a
  duplicate `Not run` row for the same check run locally.
- Do not present ad hoc checks from the session as a test suite.

**Screenshots.** For a change to what users see, a screenshot is the fastest
evidence there is. Set `ui.visible` to `true` and capture one shot after the
change for each state it adds or alters:

```json
"ui": {
  "visible": true,
  "shots": [
    { "path": "receipts-default.png", "caption": "default" },
    { "path": "receipts-empty.png", "caption": "empty", "preview": true }
  ],
  "notCaptured": [
    { "state": "error", "reason": "no failing fixture", "checked": "component test renders the retry button" }
  ]
}
```

- Paths are relative to the data file. The script embeds the images.
- Mark a Storybook, Compose preview, or other isolated render with
  `"preview": true`. It shows the component, not that the real screen works.
- When a state cannot be captured, list it in `notCaptured` with the reason and
  what you checked instead. `shots` may be empty when nothing could be captured. A missing screenshot does not block the brief, but
  it must never be silently missing.
- A "before" shot is optional; add one when you already have it or are asked.

**Needs attention.** Everything the human must act on goes here and nowhere
else, so one list is enough to read. Tags:

- `Breaking`: changed behavior for existing consumers, with migration or rollout.
- `Scope`: the change does more than its task or request says, or it is already
  integrated, so approval would be after the fact.
- `Deferred`: agreed scope that this change does not deliver.
- `Decision`: a choice only the human can make.
- `Known issue`: a problem you found and did not fix, with `file:line` and its
  practical effect.
- `Unverified`: behavior nothing checked.

**Graph.** When the change is a task in a graph, pass the whole graph from
context and the page ends with a chart of where the work stands:

```json
"graph": {
  "current": "T3",
  "tasks": [
    { "id": "T1", "title": "Delete endpoint", "status": "integrated" },
    { "id": "T3", "title": "Delete button", "status": "awaiting-human-review", "needs": ["T1"] },
    { "id": "T4", "title": "Undo toast", "status": "blocked", "needs": ["T3"] }
  ]
}
```

`status` uses the lifecycle names: `blocked`, `ready`, `implementing`,
`validating`, `awaiting-human-review`, `approved`, `integrated`, `verified`.
Omit `current` in a final handoff. Leave `graph` out when there is no graph.

**File tree corrections.** The script sorts each changed file into Production,
Tests, or Other (docs, lockfiles, generated output, tooling) by its path. Check
the `P`/`T`/`O` column after the first run and fix mistakes with glob patterns:

```json
"classify": { "production": ["docs/public-api/**"], "other": ["scripts/release/**"] },
"generated": ["src/generated/**"]
```

`generated` collapses a batch of repetitive generated files into one line with
a count and totals. Use it only for generated output; every hand-written file
and every lockfile keeps its own line.

### 3. Build the page

```sh
node <this skill's folder>/scripts/brief.mjs <data.json>
```

Run it from the repository the session works in. Add `--repo <dir>` when the
change lives in another checkout, such as a worker's worktree, and `--out
<file>` to choose where the page goes. By default it is written to
`.briefs/` in the current repository, ignored through
`.git/info/exclude` so it never appears in `git status`. That is inside the
workspace on purpose: built-in browser panes usually cannot open files outside
it.

The page is one self-contained file. It loads nothing from the network, so it
opens the same offline, and the code on it goes nowhere.

A brief is evidence for one approval, not a record to keep. Each run clears
`.briefs/` of pages whose change has merged into its base, whose commit no
longer exists, or that are more than two weeks old. When a change integrates
some other way, as a squash or a new commit on another branch, its page cannot be
recognized as merged: delete that page once integration is verified. `node
<this skill's folder>/scripts/brief.mjs --prune` runs the cleanup on its own.

The script stops and lists every problem when the data is incomplete or a range
matches nothing. Fix the data and rerun; do not work around it by writing the
page yourself.

### 4. Show it

1. Open the page for the human in the harness's built-in browser pane. Look
   through your tools for one that shows a local file or opens a browser tab;
   in OpenCode that is `browser.tabs.open({ path })`. Use it without being
   asked: the page is the deliverable.
2. Look at the rendered page once. Check that the `P`/`T`/`O` column is right
   and each excerpt shows the interface you meant.
3. Reply with the script's output exactly as printed. It is the chat stub:
   scope, size, and evidence lines, Outcome, Needs attention, the graph when
   there is one, and the page's path and link. When no browser pane exists, the
   link is how the human opens it.

When you are a subagent, you cannot show the human anything: build the page,
skip the first step, check the script's output and the page's HTML if you
cannot render it, and return the stub with the page's path to the agent that
called you. That agent opens the page and delivers the stub. When you receive a
brief from a subagent, check it against the final revision, rebuild it if the
change moved, then show it as above.

Add nothing before the stub and do not restate the page after it. Two things
may follow it: a direct answer of a sentence or two when the human asked a
question, such as "can I trust this?", and a caller's approval question.

## Boundaries

- Report validation gaps plainly.
- [create-pr](../create-pr/SKILL.md) owns the PR description. Screenshots and
  the brief stay out of it.
- Do not publish comments, edit code, or merge because a summary was requested.
  When fixes are authorized, use the established workflow and rebuild the brief.
- A brief is not approval and never waives the approval gate before
  integration. Describe behavior as proposed until integration is
  verified.
