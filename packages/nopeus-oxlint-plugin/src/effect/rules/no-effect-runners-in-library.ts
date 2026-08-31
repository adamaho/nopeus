import { defineRule } from "@oxlint/plugins";

import { isModuleCall, moduleBindings, recordModuleImport } from "./effect-call.ts";

const runners = ["runFork", "runPromise", "runPromiseExit", "runSync", "runSyncExit"] as const;

function normalizedPath(path: string): string {
  return path.replaceAll("\\", "/");
}

function isAllowed(filename: string, allowFiles: readonly string[]): boolean {
  const normalizedFilename = normalizedPath(filename);
  return allowFiles.some((path) => {
    const normalizedAllowed = normalizedPath(path).replace(/^\.\//u, "");
    return (
      normalizedFilename === normalizedAllowed ||
      normalizedFilename.endsWith("/" + normalizedAllowed)
    );
  });
}

/** Keep Effect runtime execution in explicitly configured entrypoints. */
export const noEffectRunnersInLibraryRule = defineRule({
  meta: {
    type: "problem",
    docs: { description: "Disallow Effect runtime runners outside configured entrypoint files." },
    schema: [
      {
        type: "object",
        properties: {
          allowFiles: { type: "array", items: { type: "string", minLength: 1 }, uniqueItems: true },
        },
        required: ["allowFiles"],
        additionalProperties: false,
      },
    ],
    defaultOptions: [{ allowFiles: [] }],
    messages: {
      libraryRunner:
        "Run Effects only in a configured application entrypoint; return or compose this Effect instead.",
    },
  },
  createOnce(context) {
    const effect = moduleBindings();
    return {
      ImportDeclaration(node) {
        recordModuleImport(node, "effect/Effect", "Effect", effect);
      },
      CallExpression(node) {
        const option = context.options?.[0];
        const allowFiles =
          typeof option === "object" &&
          option !== null &&
          !Array.isArray(option) &&
          Array.isArray(option.allowFiles)
            ? option.allowFiles.filter((value): value is string => typeof value === "string")
            : [];
        if (isAllowed(context.filename, allowFiles)) return;
        if (runners.some((name) => isModuleCall(node.callee, effect, name))) {
          context.report({ node: node.callee, messageId: "libraryRunner" });
        }
      },
    };
  },
});
