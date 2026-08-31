import { defineRule } from "@oxlint/plugins";

import { isModuleCall, moduleBindings, recordModuleImport } from "./effect-call.ts";

/** Prefer the current callback interop constructor. */
export const preferEffectCallbackRule = defineRule({
  meta: {
    type: "suggestion",
    docs: { description: "Prefer Effect.callback over Effect.async for callback APIs." },
    messages: {
      preferCallback:
        "Use Effect.callback for callback interop, including an Effect cleanup when registration allocates resources.",
    },
  },
  createOnce(context) {
    const effect = moduleBindings();
    return {
      ImportDeclaration(node) {
        recordModuleImport(node, "effect/Effect", "Effect", effect);
      },
      CallExpression(node) {
        if (isModuleCall(node.callee, effect, "async")) {
          context.report({ node: node.callee, messageId: "preferCallback" });
        }
      },
    };
  },
});
