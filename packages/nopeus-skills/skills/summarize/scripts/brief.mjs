#!/usr/bin/env node
// Builds a change brief: one self-contained HTML page plus a chat stub.
//
// Git supplies every countable fact (file tree, line counts, diff excerpts) so
// the reader can trust them. The data file supplies only what needs judgement.
// Invalid or incomplete data fails with every problem listed; a brief with a
// silently missing section is worse than no brief.
//
// Usage: node brief.mjs <data.json> [--out <file.html>] [--repo <dir>]

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, extname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const KINDS = { approval: "Approval brief", handoff: "Final handoff", summary: "Change summary" };
const RESULTS = ["pass", "fail", "not run"];
const TAGS = ["Breaking", "Scope", "Deferred", "Decision", "Known issue", "Unverified"];
// The page colours nodes from theme-aware CSS tokens in brief.html. Mermaid in
// the chat stub needs literal colours, so these repeat the light-theme Radix
// values those tokens use: step 3 fills, and outlines that clear 3:1.
const STATUSES = {
  blocked: { label: "blocked", fill: "#f0f0f3", stroke: "#8b8d98" }, // slate-3, slate-9
  ready: { label: "ready", fill: "#fcfcfd", stroke: "#60646c" }, // slate-1, slate-11
  implementing: { label: "implementing", fill: "#e6f4fe", stroke: "#0d74ce" }, // blue-3, blue-11
  validating: { label: "validating", fill: "#e6f4fe", stroke: "#0d74ce" }, // blue-3, blue-11
  "awaiting-human-review": { label: "awaiting review", fill: "#fff7c2", stroke: "#ab6400" }, // amber-3, amber-11
  approved: { label: "approved", fill: "#e0f8f3", stroke: "#008573" }, // teal-3, teal-11
  integrated: { label: "integrated", fill: "#e9f6e9", stroke: "#2a7e3b" }, // grass-3, grass-11
  verified: { label: "verified", fill: "#e9f6e9", stroke: "#2a7e3b" }, // grass-3, grass-11
};
const NODE_TEXT = "#1c2024"; // slate-12
const DONE = new Set(["integrated", "verified"]);
const BUCKETS = ["production", "tests", "other"];
const OUT_DIR = "briefs";
const GIT_STATUS = { A: "added", M: "modified", D: "deleted", R: "renamed", C: "added" };
const MIME = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

// ---------------------------------------------------------------- arguments

const args = process.argv.slice(2);
const flag = (name) => {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args.splice(index, 2)[1];
};
const outFlag = flag("--out");
const repoFlag = flag("--repo");
const dataPath = args[0];

if (!dataPath) fail(["Usage: node brief.mjs <data.json> [--out <file.html>] [--repo <dir>]"]);
if (!existsSync(dataPath)) fail([`Data file not found: ${dataPath}`]);

let data;
try {
  data = JSON.parse(readFileSync(dataPath, "utf8"));
} catch (error) {
  fail([`Data file is not valid JSON: ${error.message}`]);
}

const dataDir = dirname(resolve(dataPath));

function fail(problems) {
  console.error(`brief: cannot build the page\n${problems.map((p) => `  - ${p}`).join("\n")}`);
  process.exit(1);
}

// ---------------------------------------------------------------------- git

const cwd = resolve(repoFlag ?? process.cwd());

function git(gitArgs, { allowFail = false } = {}) {
  try {
    return execFileSync("git", gitArgs, {
      cwd,
      encoding: "utf8",
      maxBuffer: 512 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    if (allowFail) return undefined;
    fail([`git ${gitArgs.join(" ")} failed: ${String(error.stderr || error.message).trim()}`]);
  }
}

const repoRoot = git(["rev-parse", "--show-toplevel"]).trim();
const repoName = basename(repoRoot);

// --------------------------------------------------------------- validation

const problems = [];
const isText = (value) => typeof value === "string" && value.trim() !== "";
const list = (value) => (Array.isArray(value) ? value : []);
const check = (ok, message) => {
  if (!ok) problems.push(message);
};

check(data.kind in KINDS, `kind must be one of: ${Object.keys(KINDS).join(", ")}`);
check(isText(data.base), "base is required: the revision this change is compared against");
check(
  Array.isArray(data.outcome) && data.outcome.length >= 1 && data.outcome.length <= 3 && data.outcome.every(isText),
  "outcome must be 1 to 3 bullets, each something a user or caller can now do",
);

check(Array.isArray(data.interfaces), "interfaces is required; use [] when no public interface changed");
list(data.interfaces).forEach((entry, i) => {
  check(isText(entry.title), `interfaces[${i}].title is required: the interface's name, e.g. "createOrder"`);
  check(isText(entry.file), `interfaces[${i}].file is required`);
  check(isText(entry.note), `interfaces[${i}].note is required: one sentence on what the interface is for`);
  check(
    isText(entry.lines) || isText(entry.oldLines),
    `interfaces[${i}] needs lines (new side) or oldLines (removed interface), e.g. "42-44"`,
  );
});
check(list(data.design).every(isText), "design must be a list of one-line bullets");

if (data.components !== undefined) {
  check(
    Array.isArray(data.components.tree) && data.components.tree.length > 0,
    "components.tree must list at least one component",
  );
  const walk = (nodes, path) =>
    list(nodes).forEach((node, i) => {
      check(isText(node.name), `${path}[${i}].name is required`);
      check(
        ["A", "M", "D", "·"].includes(node.status),
        `${path}[${i}].status must be A, M, D, or · (unchanged, shown only to connect changed components)`,
      );
      check(isText(node.owns), `${path}[${i}].owns is required, e.g. "render only" or "data: useReceipt"`);
      walk(node.children, `${path}[${i}].children`);
    });
  walk(data.components.tree, "components.tree");
  check(
    data.components.usage && isText(data.components.usage.file) && isText(data.components.usage.lines),
    "components.usage needs file and lines pointing at one real composition snippet",
  );
}

check(
  Array.isArray(data.tests?.summary) &&
    data.tests.summary.length >= 1 &&
    data.tests.summary.length <= 3 &&
    data.tests.summary.every(isText),
  "tests.summary must be 1 to 3 bullets on what the tests protect, or why none are needed",
);
check(
  Array.isArray(data.tests?.gaps) && data.tests.gaps.every(isText),
  "tests.gaps is required: changed behaviors with no test; use [] when there are none",
);

check(
  data.validation && Array.isArray(data.validation.checks) && data.validation.checks.length > 0,
  "validation.checks must list at least one check, including checks that were not run",
);
check(
  isText(data.validation?.revision),
  'validation.revision is required: the revision the checks ran on, or "working tree"',
);
list(data.validation?.checks).forEach((row, i) => {
  const result = String(row.result).toLowerCase();
  check(isText(row.check), `validation.checks[${i}].check is required`);
  check(RESULTS.includes(result), `validation.checks[${i}].result must be one of: Pass, Fail, Not run`);
  check(result === "not run" || isText(row.command), `validation.checks[${i}].command is required for a check that ran`);
  check(result === "pass" || isText(row.detail), `validation.checks[${i}].detail is required to explain ${row.result}`);
});

check(
  data.ui && typeof data.ui.visible === "boolean",
  "ui.visible is required: true when the change affects what users see",
);
if (data.ui?.visible === true) {
  check(
    list(data.ui.shots).length + list(data.ui.notCaptured).length > 0,
    "a visible UI change needs ui.shots, or ui.notCaptured saying why and what was checked instead",
  );
}
list(data.ui?.shots).forEach((shot, i) => {
  check(isText(shot.caption), `ui.shots[${i}].caption is required: the state shown, e.g. "empty"`);
  const path = isText(shot.path) ? resolveFrom(dataDir, shot.path) : undefined;
  check(path !== undefined && existsSync(path), `ui.shots[${i}].path does not exist: ${shot.path}`);
  check(path === undefined || extname(path).toLowerCase() in MIME, `ui.shots[${i}].path must be an image file`);
});
list(data.ui?.notCaptured).forEach((entry, i) => {
  check(isText(entry.state), `ui.notCaptured[${i}].state is required`);
  check(isText(entry.reason), `ui.notCaptured[${i}].reason is required`);
  check(isText(entry.checked), `ui.notCaptured[${i}].checked is required: what was checked instead`);
});

check(Array.isArray(data.attention), "attention is required; use [] when nothing needs the human");
list(data.attention).forEach((item, i) => {
  check(TAGS.includes(item.tag), `attention[${i}].tag must be one of: ${TAGS.join(", ")}`);
  check(isText(item.text), `attention[${i}].text is required`);
});

if (data.graph !== undefined) {
  const tasks = list(data.graph.tasks);
  const ids = new Set(tasks.map((task) => task.id));
  check(tasks.length > 0, "graph.tasks must list every task in the graph");
  tasks.forEach((task, i) => {
    check(isText(task.id), `graph.tasks[${i}].id is required`);
    check(isText(task.title), `graph.tasks[${i}].title is required`);
    check(task.status in STATUSES, `graph.tasks[${i}].status must be one of: ${Object.keys(STATUSES).join(", ")}`);
    list(task.needs).forEach((need) => check(ids.has(need), `graph.tasks[${i}].needs names unknown task ${need}`));
  });
  check(data.graph.current === undefined || ids.has(data.graph.current), "graph.current names an unknown task");
}

if (problems.length > 0) fail(problems);

// -------------------------------------------------------------------- scope

const uncommitted = data.uncommitted === true;
const headRef = data.head ?? "HEAD";
if (uncommitted && headRef !== "HEAD") fail(["uncommitted changes can only be included when head is HEAD"]);

const headSha = git(["rev-parse", "--verify", `${headRef}^{commit}`]).trim();
const baseTip = git(["rev-parse", "--verify", `${data.base}^{commit}`]).trim();
// Compare against the merge base so commits that landed on the base branch
// after this work started do not appear as part of the change.
const baseSha = (git(["merge-base", baseTip, headSha], { allowFail: true }) ?? baseTip).trim();
const short = (sha) => sha.slice(0, 7);
const diffRange = uncommitted ? [baseSha] : [baseSha, headSha];

const branchName = headRef === "HEAD" ? git(["rev-parse", "--abbrev-ref", "HEAD"]).trim() : headRef;
// A head given as a revision already appears in the range; do not repeat it.
const showBranch = !headSha.startsWith(branchName);
const dirtyCount = git(["status", "--porcelain"]).split("\n").filter(Boolean).length;
const uncommittedNote = uncommitted
  ? "uncommitted changes included"
  : headRef === "HEAD" && dirtyCount > 0
    ? `${dirtyCount} uncommitted ${dirtyCount === 1 ? "file" : "files"} not included`
    : "no uncommitted changes";

// -------------------------------------------------------------------- files

function countLines(text) {
  if (text === "") return 0;
  const newlines = text.split("\n").length - 1;
  return text.endsWith("\n") ? newlines : newlines + 1;
}

function changedFiles() {
  const files = new Map();
  const names = git(["diff", "--name-status", "-M", "-z", ...diffRange]).split("\0");
  for (let i = 0; i < names.length - 1; ) {
    const status = names[i][0];
    if (status === "R" || status === "C") {
      files.set(names[i + 2], { path: names[i + 2], oldPath: names[i + 1], status });
      i += 3;
    } else {
      files.set(names[i + 1], { path: names[i + 1], status });
      i += 2;
    }
  }

  const stats = git(["diff", "--numstat", "-M", "-z", ...diffRange]).split("\0");
  for (let i = 0; i < stats.length - 1; ) {
    const [added, deleted, path] = stats[i].split("\t");
    const target = path === "" ? stats[i + 2] : path;
    i += path === "" ? 3 : 1;
    const file = files.get(target);
    if (!file) continue;
    file.binary = added === "-";
    file.added = file.binary ? 0 : Number(added);
    file.deleted = file.binary ? 0 : Number(deleted);
  }

  if (uncommitted) {
    const untracked = git(["ls-files", "--others", "--exclude-standard", "-z"]).split("\0").filter(Boolean);
    for (const path of untracked) {
      const bytes = readFileSync(join(repoRoot, path));
      const binary = bytes.subarray(0, 8000).includes(0);
      files.set(path, {
        path,
        status: "A",
        untracked: true,
        binary,
        added: binary ? 0 : countLines(bytes.toString("utf8")),
        deleted: 0,
      });
    }
  }
  return [...files.values()];
}

function globToRegex(pattern) {
  const prefix = pattern.endsWith("/") ? `${pattern}**` : pattern;
  const source = prefix
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "\u0000")
    .replace(/\*/g, "[^/]*")
    .replace(/\u0000/g, ".*");
  return new RegExp(`^${source}$`);
}

const overrides = BUCKETS.flatMap((bucket) =>
  list(data.classify?.[bucket]).map((pattern) => ({ bucket, regex: globToRegex(pattern) })),
);
const generatedPatterns = list(data.generated).map((pattern) => ({ pattern, regex: globToRegex(pattern) }));

const LOCKFILE =
  /(^|\/)(pnpm-lock\.yaml|package-lock\.json|yarn\.lock|bun\.lockb?|Cargo\.lock|Gemfile\.lock|poetry\.lock|uv\.lock|go\.sum|composer\.lock|gradle\.lockfile)$/;
const TEST_PATH =
  /(^|\/)(tests?|__tests__|__mocks__|__snapshots__|specs?|e2e|fixtures|testFixtures|androidTest|testdata)\//i;
const TEST_FILE = /(\.(test|spec)\.[a-z]+|_test\.(go|py|rb)|(Test|Tests|Spec)\.(kt|java|swift|cs))$|(^|\/)test_[^/]+\.py$/;
const DOCS = /(\.mdx?|\.rst|\.adoc)$|(^|\/)(docs?|LICENSE[^/]*|CHANGELOG[^/]*|NOTICE)(\/|$)/i;
const TOOLING =
  /(^|\/)(\.github|\.changeset|\.vscode|\.idea|\.husky|\.agents)\/|(^|\/)\.(gitignore|gitattributes|editorconfig|npmrc|nvmrc|prettierrc[^/]*|eslintrc[^/]*)$|(^|\/)(oxlint|oxfmt|eslint|prettier|vitest|jest|playwright|turbo|lefthook|renovate)[^/]*\.(json|jsonc|js|cjs|mjs|ts|ya?ml)$/;

function classify(path) {
  const override = overrides.find((entry) => entry.regex.test(path));
  if (override) return override.bucket;
  if (generatedPatterns.some((entry) => entry.regex.test(path)) || LOCKFILE.test(path)) return "other";
  // A skill's instructions are the shipped product, not documentation about it.
  if (basename(path) === "SKILL.md") return "production";
  if (TEST_PATH.test(path) || TEST_FILE.test(path)) return "tests";
  if (DOCS.test(path) || TOOLING.test(path)) return "other";
  return "production";
}

const files = changedFiles().map((file) => ({ ...file, bucket: classify(file.path) }));
if (files.length === 0) fail([`No changes between ${short(baseSha)} and ${uncommitted ? "the working tree" : short(headSha)}`]);

// --------------------------------------------------------------------- html

const esc = (value) =>
  String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// Text fields accept only `code` and **bold**, so data cannot alter the layout.
const inline = (value) =>
  esc(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
const signed = (count, sign) => `${sign}${count}`;

function resolveFrom(base, path) {
  return isAbsolute(path) ? path : resolve(base, path);
}

// ----------------------------------------------------------------- snapshot

function renderTotals() {
  const rows = BUCKETS.map((bucket) => {
    const members = files.filter((file) => file.bucket === bucket);
    const added = members.reduce((sum, file) => sum + file.added, 0);
    const deleted = members.reduce((sum, file) => sum + file.deleted, 0);
    return { bucket, count: members.length, added, deleted };
  });
  const cells = rows
    .map(
      (row) => `<div class="total total-${row.bucket}">
  <dt><span class="share-key share-${row.bucket}"></span>${row.bucket[0].toUpperCase()}${row.bucket.slice(1)}</dt>
  <dd class="total-added">${signed(row.added, "+")}</dd>
  <dd class="total-meta"><span class="del">${signed(row.deleted, "−")}</span> · ${row.count} ${row.count === 1 ? "file" : "files"}</dd>
</div>`,
    )
    .join("\n");

  const counts = { A: 0, M: 0, D: 0, R: 0, C: 0 };
  for (const file of files) counts[file.status] = (counts[file.status] ?? 0) + 1;
  const labels = { A: "added", M: "modified", D: "deleted", R: "renamed", C: "copied" };
  const summary = Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => `${count} ${labels[status]}`)
    .join(", ");

  // A proportional bar turns the three counts into a shape: a change that is
  // mostly tests or mostly lockfile reads differently before any number does.
  const totalAdded = rows.reduce((sum, row) => sum + row.added, 0);
  const share =
    totalAdded === 0
      ? ""
      : `<div class="share" role="img" aria-label="${rows.map((row) => `${row.bucket} ${Math.round((row.added / totalAdded) * 100)}%`).join(", ")} of added lines">${rows
          .filter((row) => row.added > 0)
          .map((row) => `<span class="share-${row.bucket}" style="flex-grow:${row.added}"></span>`)
          .join("")}</div>`;

  return { html: `<dl class="totals">${cells}</dl>${share}`, summary: `${files.length} files: ${summary}`, rows };
}

function treeEntries() {
  const entries = [];
  const groups = new Map();
  for (const file of files) {
    const generated = LOCKFILE.test(file.path)
      ? undefined
      : generatedPatterns.find((entry) => entry.regex.test(file.path));
    if (!generated) {
      entries.push(file);
      continue;
    }
    // Group under the fixed part of the pattern so the batch sits where it lives.
    const fixed = generated.pattern.split("*")[0].replace(/[^/]*$/, "");
    const group = groups.get(fixed) ?? { path: `${fixed}\u0000`, group: true, count: 0, added: 0, deleted: 0 };
    group.count += 1;
    group.added += file.added;
    group.deleted += file.deleted;
    groups.set(fixed, group);
  }
  return [...entries, ...groups.values()];
}

function renderTree() {
  const root = { dirs: new Map(), files: [] };
  for (const entry of treeEntries()) {
    const parts = entry.path.split("/");
    let node = root;
    for (const part of parts.slice(0, -1)) {
      if (!node.dirs.has(part)) node.dirs.set(part, { dirs: new Map(), files: [] });
      node = node.dirs.get(part);
    }
    node.files.push({ ...entry, name: parts.at(-1) });
  }

  const rows = [];
  const walk = (node, prefix, top) => {
    const dirs = [...node.dirs]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, child]) => {
        // Collapse single-child folder chains so depth reflects real structure.
        while (child.files.length === 0 && child.dirs.size === 1) {
          const [[nextName, nextChild]] = [...child.dirs];
          name = `${name}/${nextName}`;
          child = nextChild;
        }
        return { name, child };
      });
    const leaves = node.files.sort((a, b) => a.name.localeCompare(b.name));
    const items = [...dirs.map((dir) => ({ dir })), ...leaves.map((file) => ({ file }))];
    items.forEach((item, index) => {
      const last = index === items.length - 1;
      const branch = top ? "" : `${prefix}${last ? "└── " : "├── "}`;
      const childPrefix = top ? "" : `${prefix}${last ? "    " : "│   "}`;
      if (item.dir) {
        rows.push(
          `<div class="row"><span class="name"><span class="branch">${branch}</span><span class="dir">${esc(item.dir.name)}/</span></span></div>`,
        );
        walk(item.dir.child, childPrefix, false);
      } else {
        rows.push(renderFileRow(item.file, branch));
      }
    });
  };
  walk(root, "", true);
  // The same tree as data, for the interactive file tree that replaces this
  // plain one when its library loads.
  const payload = {
    rows: rows.length,
    files: treeEntries().map((entry) =>
      entry.group
        ? {
            path: entry.path.replace("\u0000", `${entry.count} generated ${entry.count === 1 ? "file" : "files"}`),
            bucket: "other",
            added: entry.added,
            deleted: entry.deleted,
          }
        : {
            path: entry.path,
            status: entry.untracked ? "untracked" : GIT_STATUS[entry.status],
            bucket: entry.bucket,
            added: entry.added,
            deleted: entry.deleted,
            binary: entry.binary,
            from: entry.oldPath,
          },
    ),
  };
  return `<div class="tree" data-tree="${esc(JSON.stringify(payload))}">${rows.join("\n")}</div>`;
}

function renderFileRow(file, branch) {
  if (file.group) {
    return `<div class="row"><span class="name"><span class="branch">${branch}</span><span class="dim">${file.count} generated ${file.count === 1 ? "file" : "files"}</span></span><span class="st"></span><span class="bucket bucket-other" title="other">O</span><span class="add">${signed(file.added, "+")}</span><span class="del">${signed(file.deleted, "−")}</span></div>`;
  }
  const from = file.oldPath ? ` <span class="dim">← ${esc(file.oldPath)}</span>` : "";
  const tag = file.untracked ? ` <span class="dim">untracked</span>` : "";
  const counts = file.binary
    ? `<span class="dim">bin</span><span></span>`
    : `<span class="add">${signed(file.added, "+")}</span><span class="del">${signed(file.deleted, "−")}</span>`;
  const title = file.oldPath ? ` title="${esc(file.path)} ← ${esc(file.oldPath)}"` : "";
  return `<div class="row"><span class="name"${title}><span class="branch">${branch}</span>${esc(file.name)}${from}${tag}</span><span class="st st-${file.status}">${file.status}</span><span class="bucket bucket-${file.bucket}" title="${file.bucket}">${file.bucket[0].toUpperCase()}</span>${counts}</div>`;
}

// ---------------------------------------------------------------- contracts

function parseRanges(spec) {
  return String(spec)
    .split(",")
    .map((part) => {
      const [start, end] = part.trim().split("-").map(Number);
      return { start, end: end ?? start };
    });
}

const inRanges = (ranges, line) => ranges.some((range) => line >= range.start && line <= range.end);

function readAtHead(path) {
  if (uncommitted) {
    const absolute = join(repoRoot, path);
    return existsSync(absolute) ? readFileSync(absolute, "utf8") : undefined;
  }
  return git(["show", `${headSha}:${path}`], { allowFail: true });
}

// Returns the diff lines that fall inside the requested range, so an excerpt
// is always real code from the compared revisions and never retyped.
function excerpt(entry) {
  const useOld = !isText(entry.lines);
  const ranges = parseRanges(useOld ? entry.oldLines : entry.lines);
  const file = files.find((candidate) => candidate.path === entry.file || candidate.oldPath === entry.file);

  if (!file || file.untracked) {
    const text = readAtHead(entry.file);
    if (text === undefined) fail([`interfaces: ${entry.file} does not exist at the compared revision`]);
    const sign = file?.untracked ? "+" : " ";
    return text
      .split("\n")
      .map((line, index) => ({ sign, text: line, oldLine: file?.untracked ? 1 : index + 1, newLine: index + 1 }))
      .filter((line) => inRanges(ranges, line.newLine));
  }

  const paths = file.oldPath ? [file.oldPath, file.path] : [file.path];
  const diff = git(["diff", "-M", "-U1000000", ...diffRange, "--", ...paths]).split("\n");
  const lines = [];
  let oldLine = 0;
  let newLine = 0;
  let inHunk = false;
  for (const raw of diff) {
    const header = raw.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)/);
    if (header) {
      oldLine = Number(header[1]);
      newLine = Number(header[2]);
      inHunk = true;
      continue;
    }
    if (!inHunk || raw.startsWith("\\")) continue;
    const sign = raw[0];
    const text = raw.slice(1);
    if (sign === "+") {
      if (!useOld && inRanges(ranges, newLine)) lines.push({ sign, text, oldLine, newLine });
      newLine += 1;
    } else if (sign === "-") {
      // A removed line belongs to the new-side range it was removed from.
      if (useOld ? inRanges(ranges, oldLine) : inRanges(ranges, newLine)) lines.push({ sign, text, oldLine, newLine });
      oldLine += 1;
    } else if (sign === " ") {
      if (inRanges(ranges, useOld ? oldLine : newLine)) lines.push({ sign, text, oldLine, newLine });
      oldLine += 1;
      newLine += 1;
    }
  }
  return lines;
}

// A diff is only useful when the range mixes changed and surviving lines.
// Wholly new, wholly removed, or untouched code reads better as plain code
// with a label, so the reader is not left hunting for what changed.
function excerptKind(lines) {
  const signs = new Set(lines.map((line) => line.sign));
  if (signs.size > 1) return "changed";
  return signs.has("+") ? "new" : signs.has("-") ? "removed" : "unchanged";
}

function dedent(lines) {
  const indent = Math.min(
    ...lines.filter((line) => line.text.trim() !== "").map((line) => line.text.match(/^[ \t]*/)[0].length),
  );
  return lines.map((line) => line.text.slice(Number.isFinite(indent) ? indent : 0));
}

function renderCode(lines, plain) {
  // Strip shared indentation so nested signatures stay readable.
  const indent = Math.min(
    ...lines.filter((line) => line.text.trim() !== "").map((line) => line.text.match(/^[ \t]*/)[0].length),
  );
  const strip = Number.isFinite(indent) ? indent : 0;
  return `<pre class="code">${lines
    .map((line) => {
      if (plain) return `<span class="ln">${esc(line.text.slice(strip)) || " "}</span>`;
      const kind = line.sign === "+" ? "plus" : line.sign === "-" ? "minus" : "ctx";
      return `<span class="ln ln-${kind}"><span class="sign">${line.sign === " " ? " " : line.sign}</span>${esc(line.text.slice(strip)) || " "}</span>`;
    })
    .join("")}</pre>`;
}

// Rebuilds a unified patch from the selected lines. Each line carries the old
// and new position it sits at, so hunks keep their real line numbers and a
// gap between selected ranges starts a new hunk.
function toPatch(file, lines) {
  const hunks = [];
  let hunk;
  for (const line of lines) {
    const fits =
      hunk !== undefined &&
      (line.sign === "+" || line.oldLine === hunk.oldStart + hunk.oldCount) &&
      (line.sign === "-" || line.newLine === hunk.newStart + hunk.newCount);
    if (!fits) {
      hunk = { oldStart: line.oldLine, newStart: line.newLine, oldCount: 0, newCount: 0, body: [] };
      hunks.push(hunk);
    }
    if (line.sign !== "+") hunk.oldCount += 1;
    if (line.sign !== "-") hunk.newCount += 1;
    hunk.body.push(`${line.sign}${line.text}`);
  }
  const start = (first, count) => (count === 0 ? Math.max(0, first - 1) : first);
  const body = hunks.map(
    (h) =>
      `@@ -${start(h.oldStart, h.oldCount)},${h.oldCount} +${start(h.newStart, h.newCount)},${h.newCount} @@\n${h.body.join("\n")}`,
  );
  return `diff --git a/${file} b/${file}\n--- a/${file}\n+++ b/${file}\n${body.join("\n")}\n`;
}

function renderExcerpt(entry, label) {
  const lines = excerpt(entry);
  const spec = isText(entry.lines) ? entry.lines : entry.oldLines;
  if (lines.length === 0) fail([`${label}: ${entry.file}:${spec} matches no lines at the compared revision`]);
  if (lines.length > 40) {
    console.error(`brief: warning: ${entry.file}:${spec} is ${lines.length} lines; show signatures and types only`);
  }
  const kind = excerptKind(lines);
  const source =
    kind === "changed"
      ? `data-patch="${esc(toPatch(entry.file, lines))}"`
      : `data-name="${esc(basename(entry.file))}" data-code="${esc(dedent(lines).join("\n"))}"`;
  return `<article class="excerpt">
  <header class="excerpt-head">
    ${isText(entry.title) ? `<h3 class="excerpt-title">${inline(entry.title)}</h3>` : ""}
    <span class="chip chip-${kind}">${cap(kind)}</span>
    <code class="excerpt-path">${esc(entry.file)}:${esc(spec)}</code>
  </header>
  ${entry.note ? `<p class="excerpt-note">${inline(entry.note)}</p>` : ""}
  <div class="diff" ${source}>${renderCode(lines, kind !== "changed")}</div>
</article>`;
}

function renderComponents() {
  if (!data.components) return "";
  const rows = [];
  const walk = (nodes, prefix, top) =>
    nodes.forEach((node, index) => {
      const last = index === nodes.length - 1;
      const branch = top ? "" : `${prefix}${last ? "└── " : "├── "}`;
      const status = node.status === "·" ? `<span class="st dim">·</span>` : `<span class="st st-${node.status}">${node.status}</span>`;
      rows.push(
        `<div class="row row-component"><span class="name"><span class="branch">${branch}</span>${esc(node.name)}</span>${status}<span class="owns">${inline(node.owns)}</span></div>`,
      );
      walk(list(node.children), top ? "" : `${prefix}${last ? "    " : "│   "}`, false);
    });
  walk(data.components.tree, "", true);
  return `<h3>Component structure</h3>
<div class="tree">${rows.join("\n")}</div>
${renderExcerpt(data.components.usage, "components.usage")}`;
}

function renderInterfaces() {
  const blocks =
    data.interfaces.length === 0
      ? `<p class="none">No public interface changes</p>`
      : data.interfaces.map((entry, i) => renderExcerpt(entry, `interfaces[${i}]`)).join("\n");
  const design =
    list(data.design).length === 0
      ? ""
      : `<h3>Decisions</h3><ul>${data.design.map((bullet) => `<li>${inline(bullet)}</li>`).join("")}</ul>`;
  return `${blocks}\n${renderComponents()}\n${design}`;
}

// ------------------------------------------------------- tests & validation

const cap = (value) => `${value[0].toUpperCase()}${value.slice(1)}`;

// A count beside a heading says how much is in a section before reading it.
function count(n) {
  return n > 0 ? `<span class="count">${n}</span>` : "";
}

function renderTests() {
  const summary = `<ul>${data.tests.summary.map((bullet) => `<li>${inline(bullet)}</li>`).join("")}</ul>`;
  const gaps =
    data.tests.gaps.length === 0
      ? `<p class="none">No known gaps</p>`
      : `<ul>${data.tests.gaps.map((gap) => `<li>${inline(gap)}</li>`).join("")}</ul>`;
  return `${summary}<h3>Not covered${count(data.tests.gaps.length)}</h3>${gaps}`;
}

function renderValidation() {
  const claimed = data.validation.revision.trim();
  const resolved = git(["rev-parse", "--verify", "--quiet", `${claimed}^{commit}`], { allowFail: true })?.trim();
  // Checks that ran on another revision do not vouch for this one; say so.
  const stale = uncommitted ? claimed.toLowerCase() !== "working tree" : resolved !== headSha;
  const target = uncommitted ? "the working tree" : short(headSha);
  const passed = data.validation.checks.filter((row) => row.result.toLowerCase() === "pass").length;
  const ran = `<p class="ran">${passed} of ${data.validation.checks.length} passed · ran on <code>${esc(resolved ? short(resolved) : claimed)}</code>${
    stale ? ` <span class="chip chip-fail">Stale: this brief covers ${esc(target)}</span>` : ""
  }</p>`;
  const rows = data.validation.checks
    .map((row) => {
      const result = row.result.toLowerCase();
      const where = isText(row.revision) ? ` <span class="chip chip-manual">on ${esc(row.revision)}</span>` : "";
      const detail = `${where}${isText(row.detail) ? ` <span class="dim">${inline(row.detail)}</span>` : ""}`;
      const command = isText(row.command) ? `<code>${esc(row.command)}</code>` : "—";
      return `<tr><td>${inline(row.check)}</td><td>${command}</td><td><span class="chip chip-${result.replace(" ", "-")}">${cap(result)}</span>${detail}</td></tr>`;
    })
    .join("\n");
  return `${ran}<div class="table-wrap"><table><thead><tr><th scope="col">Check</th><th scope="col">Command</th><th scope="col">Result</th></tr></thead><tbody>${rows}</tbody></table></div>${renderScreenshots()}`;
}

function renderScreenshots() {
  if (!data.ui.visible) return `<h3>Screenshots</h3><p class="none">No visible UI change</p>`;
  const shots = list(data.ui.shots)
    .map((shot) => {
      const path = resolveFrom(dataDir, shot.path);
      const uri = `data:${MIME[extname(path).toLowerCase()]};base64,${readFileSync(path).toString("base64")}`;
      const preview = shot.preview ? ` <span class="chip chip-gap">Preview, not runtime</span>` : "";
      return `<figure><img src="${uri}" alt="${esc(shot.caption)}"><figcaption>${inline(shot.caption)}${preview}</figcaption></figure>`;
    })
    .join("\n");
  const missing = list(data.ui.notCaptured)
    .map(
      (entry) =>
        `<li><strong>${inline(entry.state)}</strong> not captured: ${inline(entry.reason)}. Checked instead: ${inline(entry.checked)}</li>`,
    )
    .join("");
  return `<h3>Screenshots</h3>${shots ? `<div class="shots">${shots}</div>` : ""}${missing ? `<ul>${missing}</ul>` : ""}`;
}

function renderAttention() {
  if (data.attention.length === 0) return `<p class="none">None</p>`;
  // The tag sits in its own column so the list can be scanned by kind.
  return `<ul class="tagged">${data.attention
    .map(
      (item) =>
        `<li><span class="chip tag-${item.tag.toLowerCase().replace(" ", "-")}">${esc(item.tag)}</span><span>${inline(item.text)}</span></li>`,
    )
    .join("")}</ul>`;
}

// -------------------------------------------------------------------- graph

// Lays tasks out top to bottom, one row per dependency depth. An arrow that
// skips rows gets a placeholder lane in each row it crosses, so it runs beside
// the boxes in between instead of hiding behind them.
function graphLayout(tasks, box) {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const depth = new Map();
  const visiting = new Set();
  const visit = (task) => {
    if (depth.has(task.id)) return depth.get(task.id);
    if (visiting.has(task.id)) fail([`graph has a dependency cycle through ${task.id}`]);
    visiting.add(task.id);
    const value = Math.max(-1, ...list(task.needs).map((need) => visit(byId.get(need)))) + 1;
    visiting.delete(task.id);
    depth.set(task.id, value);
    return value;
  };
  tasks.forEach(visit);

  const rows = [];
  const add = (row, item) => (rows[row] ??= []).push(item);
  for (const task of tasks) add(depth.get(task.id), { id: task.id, width: box.width, before: [] });
  const items = new Map(rows.flat().map((item) => [item.id, item]));

  const chains = [];
  for (const task of tasks) {
    for (const need of list(task.needs)) {
      const chain = [need];
      for (let row = depth.get(need) + 1; row < depth.get(task.id); row += 1) {
        const lane = { id: `${need}>${task.id}@${row}`, width: box.lane, before: [chain.at(-1)] };
        add(row, lane);
        items.set(lane.id, lane);
        chain.push(lane.id);
      }
      items.get(task.id).before.push(chain.at(-1));
      chains.push([...chain, task.id]);
    }
  }

  // Order each row by where its prerequisites sit, to reduce crossing arrows.
  const slot = new Map();
  rows.forEach((row, index) => {
    if (index > 0) {
      const average = (item) => item.before.reduce((sum, id) => sum + slot.get(id), 0) / item.before.length;
      row.sort((a, b) => average(a) - average(b));
    }
    row.forEach((item, position) => slot.set(item.id, position / Math.max(1, row.length - 1)));
  });

  const rowWidth = (row) => row.reduce((sum, item) => sum + item.width, 0) + (row.length - 1) * box.gapX;
  const width = Math.max(...rows.map(rowWidth)) + box.pad * 2;
  const height = rows.length * box.height + (rows.length - 1) * box.gapY + box.pad * 2;
  const place = new Map();
  rows.forEach((row, index) => {
    let x = (width - rowWidth(row)) / 2;
    for (const item of row) {
      place.set(item.id, { x, center: x + item.width / 2, y: box.pad + index * (box.height + box.gapY) });
      x += item.width + box.gapX;
    }
  });
  return { width, height, place, chains };
}

function wrap(text, width, maxLines) {
  const lines = [];
  let current = "";
  for (const word of text.split(/\s+/)) {
    if (`${current} ${word}`.trim().length <= width) {
      current = `${current} ${word}`.trim();
    } else {
      lines.push(current);
      current = word;
    }
  }
  lines.push(current);
  const kept = lines.filter(Boolean).slice(0, maxLines);
  if (lines.filter(Boolean).length > maxLines) kept[maxLines - 1] = `${kept[maxLines - 1].slice(0, width - 1)}…`;
  return kept;
}

function graphProgress() {
  const { tasks, current } = data.graph;
  const done = tasks.filter((task) => DONE.has(task.status)).length;
  const parts = [`${done} of ${tasks.length} integrated`];
  const currentTask = tasks.find((task) => task.id === current);
  if (currentTask && !DONE.has(currentTask.status)) {
    const status = new Map(tasks.map((task) => [task.id, task.status]));
    const unblocked = tasks
      .filter(
        (task) =>
          list(task.needs).includes(current) &&
          list(task.needs).every((need) => need === current || DONE.has(status.get(need))),
      )
      .map((task) => task.id);
    if (unblocked.length > 0) parts.push(`unblocks after integration: ${unblocked.join(", ")}`);
  }
  return parts.join(" · ");
}

function renderGraph() {
  if (!data.graph) return "";
  const { tasks, current } = data.graph;
  const box = { width: 220, height: 70, lane: 16, gapX: 28, gapY: 52, pad: 16 };
  const { width, height, place, chains } = graphLayout(tasks, box);

  const edges = chains
    .map((chain) => {
      let path = "";
      chain.slice(1).forEach((id, index) => {
        const from = place.get(chain[index]);
        const to = place.get(id);
        const last = index === chain.length - 2;
        const y1 = from.y + box.height;
        const y2 = last ? to.y - 5 : to.y;
        const mid = (y1 + y2) / 2;
        path += `${index === 0 ? `M${from.center},${y1}` : ""} C${from.center},${mid} ${to.center},${mid} ${to.center},${y2}`;
        if (!last) path += ` L${to.center},${to.y + box.height}`;
      });
      return `<path d="${path}" class="edge" marker-end="url(#arrow)"/>`;
    })
    .join("");

  const nodes = tasks
    .map((task) => {
      const { x, y } = place.get(task.id);
      const { label } = STATUSES[task.status];
      const isCurrent = task.id === current;
      const title = wrap(task.title, 30, 2)
        .map((line, index) => `<text x="${x + 12}" y="${y + 44 + index * 15}" class="node-title">${esc(line)}</text>`)
        .join("");
      // The badge straddles the top edge so it marks the box without taking
      // a line from the title.
      const badge = isCurrent
        ? `<g class="badge"><rect x="${x + 12}" y="${y - 9}" width="68" height="18" rx="4"/><text x="${x + 46}" y="${y + 4}" text-anchor="middle">This brief</text></g>`
        : "";
      const name = `${task.id}, ${label}: ${task.title}${isCurrent ? " (this brief)" : ""}`;
      return `<g class="node status-${task.status}${isCurrent ? " node-current" : ""}" role="img" aria-label="${esc(name)}"><rect x="${x}" y="${y}" width="${box.width}" height="${box.height}" rx="8"/><text x="${x + 12}" y="${y + 25}" class="node-id">${esc(task.id)}</text><text x="${x + box.width - 12}" y="${y + 25}" text-anchor="end" class="node-status">${esc(label)}</text>${title}${badge}</g>`;
    })
    .join("");

  const used = [...new Set(tasks.map((task) => task.status))];
  const legend = Object.keys(STATUSES)
    .filter((status) => used.includes(status))
    .map(
      (status) =>
        `<span class="legend-item"><span class="swatch status-${status}"></span>${STATUSES[status].label}</span>`,
    )
    .join("");

  const icon = (d) => `<svg viewBox="0 0 14 14" aria-hidden="true"><path d="${d}"/></svg>`;
  const tools = [
    `<button type="button" data-zoom="out" aria-label="Zoom out" title="Zoom out">${icon("M3 7h8")}</button>`,
    `<button type="button" data-zoom="in" aria-label="Zoom in" title="Zoom in">${icon("M3 7h8M7 3v8")}</button>`,
    `<button type="button" data-zoom="fit" aria-label="Fit the whole graph" title="Fit the whole graph">Fit</button>`,
  ].join("");
  const hint = "Drag or use arrow keys to pan · Ctrl/Cmd + scroll, pinch, or + and − to zoom · 0 resets";

  return `<section id="graph">
<h2>Graph position</h2>
<p class="ran">${esc(graphProgress())}</p>
<div class="graph"><div class="graph-bar"><p class="graph-hint" id="graph-hint">${hint}</p><div class="graph-tools" role="group" aria-label="Graph zoom">${tools}</div></div><svg viewBox="0 0 ${width} ${height}" style="height:${Math.min(height, 560)}px" tabindex="0" role="group" aria-label="Task graph, ${tasks.length} tasks. Arrow keys pan, plus and minus zoom, 0 resets the view." aria-describedby="graph-hint">
<defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" class="arrowhead"/></marker></defs>
${edges}${nodes}
</svg></div>
<div class="legend">${legend}</div>
</section>`;
}

function mermaid() {
  const { tasks, current } = data.graph;
  const name = (status) => status.replace(/-/g, "_");
  const safe = (text) => text.replace(/["[\]]/g, "'");
  const lines = ["flowchart TD"];
  for (const task of tasks) {
    lines.push(`  ${task.id}["${safe(task.id)} ${safe(task.title)}"]:::${name(task.status)}`);
  }
  for (const task of tasks) for (const need of list(task.needs)) lines.push(`  ${need} --> ${task.id}`);
  for (const status of new Set(tasks.map((task) => task.status))) {
    lines.push(`  classDef ${name(status)} fill:${STATUSES[status].fill},stroke:${STATUSES[status].stroke},color:${NODE_TEXT}`);
  }
  if (current) lines.push(`  style ${current} stroke-width:4px`);
  return lines.join("\n");
}

// ------------------------------------------------------------------- output

// Built-in browser panes generally open only files inside the session's
// workspace, so the page defaults to a folder in the repository the command
// runs from. The folder is ignored through .git/info/exclude, which is local
// to this clone: nothing is committed and no tracked file changes.
function defaultOutDir() {
  const here = { cwd: process.cwd(), encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] };
  try {
    const root = execFileSync("git", ["rev-parse", "--show-toplevel"], here).trim();
    const excludeRel = execFileSync("git", ["rev-parse", "--git-path", "info/exclude"], here).trim();
    const exclude = resolveFrom(process.cwd(), excludeRel);
    const current = existsSync(exclude) ? readFileSync(exclude, "utf8") : "";
    if (!current.split("\n").includes(`/${OUT_DIR}/`)) {
      mkdirSync(dirname(exclude), { recursive: true });
      writeFileSync(exclude, `${current}${current === "" || current.endsWith("\n") ? "" : "\n"}/${OUT_DIR}/\n`);
    }
    return join(root, OUT_DIR);
  } catch {
    return join(tmpdir(), OUT_DIR, repoName);
  }
}

const kindLabel = KINDS[data.kind];
const range = uncommitted ? `${short(baseSha)}..working tree` : `${short(baseSha)}..${short(headSha)}`;
const heading = `${kindLabel}${isText(data.task) ? ` ${data.task}` : ""}`;
const scopeParts = [
  ...(showBranch ? [`<code>${esc(branchName)}</code>`] : []),
  `<code>${esc(range)}</code>`,
  esc(uncommittedNote),
];
const totals = renderTotals();
const diffCommand = `git diff ${diffRange.map(short).join(" ")}`;

// The verdict signals a reviewer looks for first, each linking to its section.
// Green means nothing to do there; anything else is worth a look.
const checkRows = data.validation.checks.map((row) => row.result.toLowerCase());
const checksPassed = checkRows.filter((result) => result === "pass").length;
const checkTone = checkRows.includes("fail") ? "bad" : checksPassed === checkRows.length ? "good" : "warn";
const many = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;
const glance = [
  { href: "#snapshot", tone: "plain", text: many(files.length, "file") },
  { href: "#validation", tone: checkTone, text: `${checksPassed} of ${many(checkRows.length, "check")} passed` },
  {
    href: "#tests",
    tone: data.tests.gaps.length === 0 ? "good" : "warn",
    text: data.tests.gaps.length === 0 ? "No test gaps" : many(data.tests.gaps.length, "test gap"),
  },
  {
    href: "#attention",
    tone: data.attention.length === 0 ? "good" : "warn",
    text: data.attention.length === 0 ? "Nothing needs attention" : `${data.attention.length} need attention`,
  },
]
  .map((item) => `<a class="glance glance-${item.tone}" href="${item.href}">${esc(item.text)}</a>`)
  .join("");

const navItems = [
  ["outcome", "Outcome"],
  ["snapshot", "Snapshot"],
  ["interfaces", "Interfaces", data.interfaces.length],
  ["tests", "Tests"],
  ["validation", "Validation"],
  ["attention", "Attention", data.attention.length],
  ...(data.graph ? [["graph", "Graph"]] : []),
]
  .map(([id, label, n]) => `<a href="#${id}">${label}${n ? `<span class="count">${n}</span>` : ""}</a>`)
  .join("");

const slots = {
  title: esc(`${heading} · ${repoName}`),
  scope: `<h1>${esc(heading)}</h1><p class="scope">${scopeParts.join(" · ")}</p><p class="glances">${glance}</p>`,
  nav: `<nav class="toc" aria-label="Sections">${navItems}</nav>`,
  n_interfaces: count(data.interfaces.length),
  n_attention: count(data.attention.length),
  outcome: `<ul>${data.outcome.map((bullet) => `<li>${inline(bullet)}</li>`).join("")}</ul>`,
  snapshot: `${totals.html}<p class="ran">${esc(totals.summary)} · <code>${esc(diffCommand)}</code></p>${renderTree()}`,
  interfaces: renderInterfaces(),
  tests: renderTests(),
  validation: renderValidation(),
  attention: renderAttention(),
  graph: renderGraph(),
};

const templatePath = join(dirname(fileURLToPath(import.meta.url)), "..", "assets", "brief.html");
const page = readFileSync(templatePath, "utf8").replace(/<!--\{\{(\w+)\}\}-->/g, (match, slot) =>
  slot in slots ? slots[slot] : match,
);

const fileName = `${(isText(data.task) ? data.task : data.kind).replace(/[^\w.-]+/g, "-")}-${short(headSha)}${uncommitted ? "-wip" : ""}.html`;
const outPath = resolve(outFlag ?? join(defaultOutDir(), fileName));
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, page);

const stubScope = [
  `**${kindLabel}**`,
  ...(isText(data.task) ? [`task \`${data.task}\``] : []),
  ...(showBranch ? [`\`${branchName}\``] : []),
  `\`${range}\``,
  uncommittedNote,
].join(" · ");
// Two computed lines so the chat alone shows how big the change is and how
// well it is covered; gaps cannot be left out of the stub by accident.
const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;
const gaps = data.tests.gaps.length;
const resultCount = (result) => data.validation.checks.filter((row) => row.result.toLowerCase() === result).length;
const sizeLine = `Size: ${plural(files.length, "file")} · ${totals.rows.map((row) => `${cap(row.bucket)} +${row.added}`).join(" · ")}`;
const evidenceLine = [
  gaps === 0 ? "no known test gaps" : plural(gaps, "test gap"),
  `${resultCount("pass")} of ${plural(data.validation.checks.length, "check")} passed`,
  ...(resultCount("fail") > 0 ? [`${resultCount("fail")} failed`] : []),
  ...(resultCount("not run") > 0 ? [`${resultCount("not run")} not run`] : []),
].join(" · ");

const stub = [
  stubScope,
  sizeLine,
  `Evidence: ${evidenceLine}`,
  "",
  "### Outcome",
  ...data.outcome.map((bullet) => `- ${bullet}`),
  "",
  "### Needs attention",
  ...(data.attention.length === 0 ? ["None"] : data.attention.map((item) => `- **${item.tag}:** ${item.text}`)),
  ...(data.graph ? ["", "### Graph position", "```mermaid", mermaid(), "```", graphProgress()] : []),
  "",
  `Brief: ${outPath}`,
  pathToFileURL(outPath).href,
];
console.log(stub.join("\n"));
