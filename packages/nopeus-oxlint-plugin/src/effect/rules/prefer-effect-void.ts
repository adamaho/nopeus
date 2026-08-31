import { defineRule, type ESTree } from "@oxlint/plugins";

import { isModuleCall, moduleBindings, recordModuleImport } from "./effect-call.ts";

function isUndefined(node: ESTree.CallExpression["arguments"][number] | undefined): boolean {
  if (node === undefined || node.type === "SpreadElement") return false;
  if (node.type === "Identifier") return node.name === "undefined";
  return (
    node.type === "UnaryExpression" &&
    node.operator === "void" &&
    node.argument.type === "Literal" &&
    node.argument.value === 0
  );
}

/** Use the canonical Effect value for successful void results. */
export const preferEffectVoidRule = defineRule({
  meta: {
    type: "suggestion",
    docs: { description: "Prefer Effect.void over Effect.succeed(undefined)." },
    messages: { preferVoid: "Use Effect.void for an Effect that succeeds with undefined." },
  },
  createOnce(context) {
    const effect = moduleBindings();
    return {
      ImportDeclaration(node) {
        recordModuleImport(node, "effect/Effect", "Effect", effect);
      },
      CallExpression(node) {
        if (isModuleCall(node.callee, effect, "succeed") && isUndefined(node.arguments[0])) {
          context.report({ node, messageId: "preferVoid" });
        }
      },
    };
  },
});
