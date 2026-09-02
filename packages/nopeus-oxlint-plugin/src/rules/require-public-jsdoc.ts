import { defineRule, type ESTree, type SourceCode } from "@oxlint/plugins";

interface Diagnostic {
  readonly code: string;
  readonly message: string;
}

interface JSDocTag {
  readonly line: number;
  readonly name: string;
  value: string;
}

const standardHeadings = ["**When to use**", "**Details**", "**Gotchas**"] as const;
const whenToUsePrefixes = ["Use to", "Use when", "Use as", "Use with"] as const;
const stableSemver = /^\d+\.\d+\.\d+$/u;
const tagOrder = new Map([
  ["deprecated", 0],
  ["see", 1],
  ["category", 2],
  ["since", 3],
]);

function diagnostic(code: string, message: string): Diagnostic {
  return { code, message };
}

function normalizeJSDoc(comment: ESTree.Comment): string[] {
  const body = comment.value.slice(1);
  const lines = body.split(/\r\n|\r|\n/u).map((line) => line.replace(/^\s*\* ?/u, "").trimEnd());

  let start = 0;
  let end = lines.length;
  if (lines[start]?.trim() === "") start++;
  if (end > start && lines[end - 1]?.trim() === "") end--;
  return lines.slice(start, end);
}

function parseTags(lines: readonly string[]): JSDocTag[] {
  const tags: JSDocTag[] = [];
  let current: JSDocTag | undefined;
  let inFence = false;

  for (const [line, source] of lines.entries()) {
    const trimmed = source.trim();
    if (trimmed.startsWith("```")) {
      inFence = !inFence;
      current = undefined;
      continue;
    }
    if (inFence) continue;

    const match = /^@([A-Za-z][\w-]*)(?:\s+(.*))?$/u.exec(trimmed);
    if (match !== null) {
      current = {
        line,
        name: match[1] ?? "",
        value: match[2]?.trim() ?? "",
      };
      tags.push(current);
      continue;
    }

    if (current !== undefined && trimmed !== "") {
      current.value = current.value === "" ? trimmed : `${current.value}\n${trimmed}`;
    } else if (trimmed === "") {
      current = undefined;
    }
  }

  return tags;
}

function isForbiddenMarkdownHeading(line: string): boolean {
  return /^#{1,6}\s+/u.test(line.trim());
}

function isBoldOnlyLine(line: string): boolean {
  return /^\*\*[^*]+\*\*\s*$/u.test(line);
}

function isNearMissHeading(line: string): boolean {
  return (
    /^\*\*(When to use|When To Use|Details|Gotchas).*\*\*/u.test(line) &&
    !standardHeadings.includes(line as (typeof standardHeadings)[number])
  );
}

function isHeadingLine(line: string | undefined): boolean {
  if (line === undefined) return false;
  const trimmed = line.trim();
  return (
    standardHeadings.includes(trimmed as (typeof standardHeadings)[number]) ||
    trimmed.startsWith("**Example**") ||
    isNearMissHeading(trimmed) ||
    isBoldOnlyLine(trimmed) ||
    isForbiddenMarkdownHeading(trimmed)
  );
}

function joinBody(lines: readonly string[]): string {
  let start = 0;
  let end = lines.length;
  while (start < end && lines[start]?.trim() === "") start++;
  while (end > start && lines[end - 1]?.trim() === "") end--;
  return lines.slice(start, end).join("\n");
}

function validateSection(
  lines: readonly string[],
  headingIndex: number,
): {
  readonly diagnostics: readonly Diagnostic[];
  readonly nextIndex: number;
  readonly body: string;
} {
  const diagnostics: Diagnostic[] = [];
  const heading = lines[headingIndex]?.trim() ?? "section";
  if (lines[headingIndex + 1]?.trim() !== "") {
    diagnostics.push(
      diagnostic("invalid-spacing", `${heading} must be followed by exactly one blank line`),
    );
  }

  let index = headingIndex + 2;
  const bodyStart = index;
  let inFence = false;
  while (index < lines.length) {
    const trimmed = lines[index]?.trim() ?? "";
    if (trimmed.startsWith("```")) {
      if (/^```ts(?:\s.*)?$/u.test(trimmed)) {
        diagnostics.push(
          diagnostic("loose-ts-fence", "TypeScript examples must use **Example** (Title) sections"),
        );
      }
      inFence = !inFence;
    }
    if (!inFence && trimmed === "" && isHeadingLine(lines[index + 1])) break;
    if (!inFence && isForbiddenMarkdownHeading(trimmed)) {
      diagnostics.push(
        diagnostic("invalid-heading", "Markdown headings are not allowed in JSDoc descriptions"),
      );
    }
    if (
      !inFence &&
      isBoldOnlyLine(trimmed) &&
      !standardHeadings.includes(trimmed as (typeof standardHeadings)[number]) &&
      !trimmed.startsWith("**Example**")
    ) {
      diagnostics.push(diagnostic("unknown-heading", `Unknown JSDoc section heading: ${trimmed}`));
    }
    index++;
  }

  const bodyLines = lines.slice(bodyStart, index);
  if (joinBody(bodyLines).trim() === "") {
    diagnostics.push(diagnostic("empty-section", `${heading} must have a non-empty body`));
  }
  if (bodyLines.at(-1)?.trim() === "") {
    diagnostics.push(
      diagnostic("invalid-spacing", "Section bodies must not end with extra blank lines"),
    );
  }

  return { body: joinBody(bodyLines), diagnostics, nextIndex: index };
}

function validateExample(
  lines: readonly string[],
  headingIndex: number,
): {
  readonly diagnostics: readonly Diagnostic[];
  readonly nextIndex: number;
  readonly title?: string;
} {
  const diagnostics: Diagnostic[] = [];
  const heading = lines[headingIndex]?.trim() ?? "";
  const match = /^\*\*Example\*\* \((.+)\)$/u.exec(heading);
  if (match === null || match[1]?.trim() === "") {
    diagnostics.push(
      diagnostic("malformed-example", "TypeScript examples must use **Example** (Title)"),
    );
  }
  if (lines[headingIndex + 1]?.trim() !== "") {
    diagnostics.push(
      diagnostic("invalid-spacing", "Example headings must be followed by exactly one blank line"),
    );
  }

  let index = headingIndex + 2;
  const bodyStart = index;
  let fenceIndex = -1;
  while (index < lines.length) {
    const trimmed = lines[index]?.trim() ?? "";
    if (/^```ts(?:\s.*)?$/u.test(trimmed)) {
      fenceIndex = index;
      break;
    }
    if (trimmed.startsWith("```")) {
      diagnostics.push(
        diagnostic("malformed-example", "Examples may only contain one TypeScript code fence"),
      );
    }
    if ((trimmed === "" && isHeadingLine(lines[index + 1])) || trimmed.startsWith("@")) break;
    index++;
  }

  if (fenceIndex === -1) {
    diagnostics.push(
      diagnostic("malformed-example", "Examples must include a non-empty ```ts fence"),
    );
    return { diagnostics, nextIndex: index };
  }

  const bodyLines = lines.slice(bodyStart, fenceIndex);
  if (joinBody(bodyLines).trim() !== "" && bodyLines.at(-1)?.trim() !== "") {
    diagnostics.push(
      diagnostic(
        "invalid-spacing",
        "Example prose must be separated from code by exactly one blank line",
      ),
    );
  }

  index = fenceIndex + 1;
  const codeStart = index;
  while (index < lines.length && lines[index]?.trim() !== "```") {
    if (/^```ts(?:\s.*)?$/u.test(lines[index]?.trim() ?? "")) {
      diagnostics.push(
        diagnostic("malformed-example", "Examples must contain exactly one TypeScript code fence"),
      );
    }
    index++;
  }
  const codeLines = lines.slice(codeStart, index);
  if (index >= lines.length) {
    diagnostics.push(
      diagnostic("malformed-example", "Examples must close the TypeScript code fence"),
    );
  }
  if (joinBody(codeLines).trim() === "") {
    diagnostics.push(
      diagnostic("malformed-example", "Examples must include non-empty TypeScript code"),
    );
  }

  index++;
  if (
    index < lines.length &&
    lines[index]?.trim() !== "" &&
    !lines[index]?.trim().startsWith("@")
  ) {
    diagnostics.push(
      diagnostic(
        "invalid-spacing",
        "Examples must be separated from following content by exactly one blank line",
      ),
    );
  }

  return {
    diagnostics,
    nextIndex: index,
    ...(match?.[1] === undefined ? {} : { title: match[1].trim() }),
  };
}

function validateDescription(lines: readonly string[]): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const seenSections = new Set<string>();
  const exampleTitles = new Set<string>();
  let index = 0;
  let currentSectionOrder = -1;
  let examplesStarted = false;

  while (index < lines.length && lines[index]?.trim() !== "" && !isHeadingLine(lines[index])) {
    if (isForbiddenMarkdownHeading(lines[index] ?? "")) {
      diagnostics.push(
        diagnostic("invalid-heading", "Markdown headings are not allowed in JSDoc descriptions"),
      );
    }
    index++;
  }

  const shortLines = lines.slice(0, index);
  if (shortLines.length === 0 || joinBody(shortLines).trim() === "") {
    diagnostics.push(diagnostic("missing-description", "JSDoc must include a short description"));
  }
  if (index < lines.length && lines[index]?.trim() === "") {
    const next = lines[index + 1];
    if (next !== undefined && !isHeadingLine(next)) {
      diagnostics.push(
        diagnostic(
          "multiple-description-paragraphs",
          "JSDoc short description must be one paragraph",
        ),
      );
    }
  }

  while (index < lines.length) {
    if (lines[index]?.trim() !== "") {
      diagnostics.push(
        diagnostic("invalid-spacing", "JSDoc sections must be separated by exactly one blank line"),
      );
      break;
    }
    if (lines[index + 1]?.trim() === "") {
      diagnostics.push(
        diagnostic("invalid-spacing", "JSDoc sections must be separated by exactly one blank line"),
      );
      while (lines[index + 1]?.trim() === "") index++;
    }
    index++;
    if (index >= lines.length) break;

    const line = lines[index]?.trim() ?? "";
    if (line.startsWith("**Example**")) {
      examplesStarted = true;
      const result = validateExample(lines, index);
      diagnostics.push(...result.diagnostics);
      if (result.title !== undefined) {
        const key = result.title.toLowerCase();
        if (exampleTitles.has(key)) {
          diagnostics.push(
            diagnostic("duplicate-example", `Duplicate example title: ${result.title}`),
          );
        }
        exampleTitles.add(key);
      }
      index = result.nextIndex;
      continue;
    }

    const sectionOrder = standardHeadings.indexOf(line as (typeof standardHeadings)[number]);
    if (sectionOrder >= 0) {
      if (examplesStarted) {
        diagnostics.push(
          diagnostic("section-after-example", `${line} must appear before examples`),
        );
      }
      if (sectionOrder <= currentSectionOrder || seenSections.has(line)) {
        diagnostics.push(
          diagnostic("section-out-of-order", `${line} is out of order or duplicated`),
        );
      }
      currentSectionOrder = Math.max(currentSectionOrder, sectionOrder);
      seenSections.add(line);
      const result = validateSection(lines, index);
      diagnostics.push(...result.diagnostics);
      if (
        line === "**When to use**" &&
        !whenToUsePrefixes.some(
          (prefix) =>
            result.body.trimStart() === prefix || result.body.trimStart().startsWith(`${prefix} `),
        )
      ) {
        diagnostics.push(
          diagnostic(
            "when-to-use-format",
            "**When to use** must start with `Use to`, `Use when`, `Use as`, or `Use with`",
          ),
        );
      }
      index = result.nextIndex;
      continue;
    }

    if (isNearMissHeading(line) || isForbiddenMarkdownHeading(line)) {
      diagnostics.push(diagnostic("invalid-heading", `Invalid JSDoc section heading: ${line}`));
    } else if (isBoldOnlyLine(line)) {
      diagnostics.push(diagnostic("unknown-heading", `Unknown JSDoc section heading: ${line}`));
    } else {
      diagnostics.push(
        diagnostic(
          "invalid-description",
          "JSDoc description content must appear under a standard section heading",
        ),
      );
    }
    index++;
  }

  return diagnostics;
}

function validateTags(tags: readonly JSDocTag[]): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const values = new Map<string, string[]>();
  let previousOrder = -1;

  for (const tag of tags) {
    if (tag.name === "internal") continue;
    if (tag.name === "example") {
      diagnostics.push(
        diagnostic(
          "forbidden-tag",
          "@example is not allowed; use a canonical **Example** (Title) section",
        ),
      );
      continue;
    }
    const order = tagOrder.get(tag.name);
    if (order === undefined) {
      diagnostics.push(
        diagnostic("forbidden-tag", `@${tag.name} is not allowed in public declaration JSDoc`),
      );
      continue;
    }
    if (order < previousOrder) {
      diagnostics.push(diagnostic("tag-out-of-order", `@${tag.name} is out of order in JSDoc`));
    }
    previousOrder = Math.max(previousOrder, order);
    values.set(tag.name, [...(values.get(tag.name) ?? []), tag.value.trim()]);
  }

  for (const tag of ["deprecated", "category", "since"]) {
    if ((values.get(tag)?.length ?? 0) > 1) {
      diagnostics.push(
        diagnostic("duplicate-tag", `JSDoc blocks may contain at most one @${tag} tag`),
      );
    }
  }
  for (const value of values.get("see") ?? []) {
    if (value === "") diagnostics.push(diagnostic("empty-tag", "@see must include a value"));
  }
  if (values.get("deprecated")?.[0] === "") {
    diagnostics.push(diagnostic("empty-tag", "@deprecated must include a message"));
  }

  const category = values.get("category")?.[0];
  if (category === undefined) {
    diagnostics.push(diagnostic("missing-tag", "Public JSDoc must include @category"));
  } else if (category === "") {
    diagnostics.push(diagnostic("empty-tag", "@category must include a value"));
  }

  const since = values.get("since")?.[0];
  if (since === undefined) {
    diagnostics.push(diagnostic("missing-tag", "Public JSDoc must include @since"));
  } else if (!stableSemver.test(since)) {
    diagnostics.push(
      diagnostic("invalid-since", "@since must be a stable semver version like 1.2.3"),
    );
  }

  return diagnostics;
}

function validateJSDoc(comment: ESTree.Comment): Diagnostic[] {
  const lines = normalizeJSDoc(comment);
  const tags = parseTags(lines);
  if (tags.some((tag) => tag.name === "internal")) return [];

  const diagnostics: Diagnostic[] = [];
  const firstTagLine = tags[0]?.line ?? lines.length;
  const content = lines.slice(0, firstTagLine);

  if (lines.length === 0) {
    diagnostics.push(diagnostic("missing-description", "JSDoc must include a short description"));
  }
  if (tags.length > 0) {
    if (
      content.at(-1)?.trim() !== "" ||
      content.length < 2 ||
      content[content.length - 2]?.trim() === ""
    ) {
      diagnostics.push(
        diagnostic(
          "invalid-spacing",
          "JSDoc tags must be separated from description content by exactly one blank line",
        ),
      );
    }
  }
  if (content[0]?.trim() === "") {
    diagnostics.push(diagnostic("leading-blank", "JSDoc must not start with a blank line"));
  }

  const description =
    tags.length > 0 && content.at(-1)?.trim() === "" ? content.slice(0, -1) : content;
  if (description.at(-1)?.trim() === "") {
    diagnostics.push(
      diagnostic("trailing-blank", "JSDoc description must not end with a blank line"),
    );
  }
  diagnostics.push(...validateDescription(description), ...validateTags(tags));

  const seen = new Set<string>();
  return diagnostics.filter((item) => {
    const key = `${item.code}:${item.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getJSDoc(sourceCode: SourceCode, node: ESTree.Node): ESTree.Comment | undefined {
  const comment = sourceCode.getCommentsBefore(node).at(-1);
  return comment?.type === "Block" && comment.value.startsWith("*") ? comment : undefined;
}

/** Require exported declarations to use the public JSDoc format enforced by Effect. */
export const requirePublicJSDocRule = defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Require exported declarations to use Effect-style public API JSDoc with canonical sections and tags.",
    },
    messages: {
      invalidJSDoc: "{{message}}",
      missingJSDoc:
        "Public declarations require Effect-style JSDoc with a description, @category, and @since.",
    },
  },
  createOnce(context) {
    const checkedFunctionOverloads = new Set<string>();

    const check = (node: ESTree.Node) => {
      const comment = getJSDoc(context.sourceCode, node);
      if (comment === undefined) {
        context.report({ node, messageId: "missingJSDoc" });
        return;
      }

      for (const item of validateJSDoc(comment)) {
        context.report({
          node,
          messageId: "invalidJSDoc",
          data: { message: item.message },
        });
      }
    };

    return {
      ExportNamedDeclaration(node) {
        const declaration = node.declaration as
          | (ESTree.Declaration & {
              readonly id?: ESTree.IdentifierName | null;
              readonly params?: unknown;
            })
          | null;
        if (
          declaration !== null &&
          "params" in declaration &&
          declaration.id?.type === "Identifier"
        ) {
          if (checkedFunctionOverloads.has(declaration.id.name)) return;
          checkedFunctionOverloads.add(declaration.id.name);
        }

        if (node.declaration !== null) {
          check(node);
          return;
        }
        for (const specifier of node.specifiers) check(specifier);
      },
    };
  },
});
