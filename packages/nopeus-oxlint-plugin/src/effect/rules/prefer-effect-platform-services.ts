import { defineRule } from "@oxlint/plugins";

const replacements = new Map([
  ["node:fs", "Effect FileSystem"],
  ["node:fs/promises", "Effect FileSystem"],
  ["fs", "Effect FileSystem"],
  ["fs/promises", "Effect FileSystem"],
  ["node:path", "Effect Path"],
  ["path", "Effect Path"],
  ["node:child_process", "effect/unstable/process ChildProcess"],
  ["child_process", "effect/unstable/process ChildProcess"],
]);

/** Keep platform I/O replaceable through Effect services. */
export const preferEffectPlatformServicesRule = defineRule({
  meta: {
    type: "problem",
    docs: { description: "Prefer Effect platform services over direct Node platform imports." },
    messages: {
      platformService:
        "Use {{replacement}} instead of importing {{source}} directly so platform I/O remains typed and replaceable.",
    },
  },
  createOnce(context) {
    return {
      ImportDeclaration(node) {
        const replacement = replacements.get(node.source.value);
        if (replacement === undefined) return;
        context.report({
          node: node.source,
          messageId: "platformService",
          data: { replacement, source: node.source.value },
        });
      },
    };
  },
});
