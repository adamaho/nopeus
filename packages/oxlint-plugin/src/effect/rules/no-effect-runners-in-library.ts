import { defineRule } from "@oxlint/plugins";

import { isModuleCall, moduleBindings } from "./effect-call.ts";

const runners = [
  "runCallback",
  "runCallbackWith",
  "runFork",
  "runForkWith",
  "runPromise",
  "runPromiseExit",
  "runPromiseExitWith",
  "runPromiseWith",
  "runSync",
  "runSyncExit",
  "runSyncExitWith",
  "runSyncWith",
] as const;

function normalizedPath(path: string): string {
  return path.replaceAll("\\", "/");
}

function repositoryRelativePath(filename: string, cwd: string): string {
  const normalizedFilename = normalizedPath(filename);
  const normalizedCwd = normalizedPath(cwd).replace(/\/$/u, "");
  return normalizedFilename.startsWith(normalizedCwd + "/")
    ? normalizedFilename.slice(normalizedCwd.length + 1)
    : normalizedFilename;
}

function isAllowed(filename: string, cwd: string, allowFiles: readonly string[]): boolean {
  const relativeFilename = repositoryRelativePath(filename, cwd);
  return allowFiles.some((path) => relativeFilename === normalizedPath(path).replace(/^\.\//u, ""));
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
    const effect = moduleBindings("effect/Effect", "Effect");
    return {
      CallExpression(node) {
        const option = context.options?.[0];
        const allowFiles =
          typeof option === "object" &&
          option !== null &&
          !Array.isArray(option) &&
          Array.isArray(option.allowFiles)
            ? option.allowFiles.filter((value): value is string => typeof value === "string")
            : [];
        if (isAllowed(context.filename, context.cwd, allowFiles)) return;
        if (runners.some((name) => isModuleCall(context.sourceCode, node.callee, effect, name))) {
          context.report({ node: node.callee, messageId: "libraryRunner" });
        }
      },
    };
  },
});
