import { defineRule } from "@oxlint/plugins";

import { isModuleCall, moduleBindings, recordModuleImport } from "./effect-call.ts";

/** Keep background fibers attached to an explicit lifetime. */
export const noUnscopedForkRule = defineRule({
  meta: {
    type: "problem",
    docs: { description: "Require forkScoped or forkIn for background Effect fibers." },
    messages: {
      scopedFork:
        "Use Effect.forkScoped or Effect.forkIn so the background fiber has an explicit lifetime.",
    },
  },
  createOnce(context) {
    const effect = moduleBindings();
    return {
      ImportDeclaration(node) {
        recordModuleImport(node, "effect/Effect", "Effect", effect);
      },
      CallExpression(node) {
        if (
          isModuleCall(node.callee, effect, "fork") ||
          isModuleCall(node.callee, effect, "forkDaemon")
        ) {
          context.report({ node: node.callee, messageId: "scopedFork" });
        }
      },
    };
  },
});
