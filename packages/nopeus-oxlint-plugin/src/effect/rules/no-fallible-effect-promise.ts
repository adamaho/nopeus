import { defineRule } from "@oxlint/plugins";

import { isModuleCall, moduleBindings, recordModuleImport } from "./effect-call.ts";

/** Keep rejected promises in Effect's typed error channel. */
export const noFallibleEffectPromiseRule = defineRule({
  meta: {
    type: "problem",
    docs: { description: "Require Effect.tryPromise for promise-producing operations." },
    messages: {
      useTryPromise:
        "Use Effect.tryPromise and map rejection into a domain error; Effect.promise turns rejection into a defect.",
    },
  },
  createOnce(context) {
    const effect = moduleBindings();
    return {
      ImportDeclaration(node) {
        recordModuleImport(node, "effect/Effect", "Effect", effect);
      },
      CallExpression(node) {
        if (isModuleCall(node.callee, effect, "promise")) {
          context.report({ node: node.callee, messageId: "useTryPromise" });
        }
      },
    };
  },
});
