import { defineRule } from "@oxlint/plugins";

import { isModuleCall, moduleBindings } from "./effect-call.ts";

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
    const effect = moduleBindings("effect/Effect", "Effect");
    return {
      CallExpression(node) {
        if (isModuleCall(context.sourceCode, node.callee, effect, "forkDetach")) {
          context.report({ node: node.callee, messageId: "scopedFork" });
        }
      },
    };
  },
});
