import { defineRule, type ESTree, type SourceCode } from "@oxlint/plugins";

import { isGlobalIdentifier, isModuleCall, moduleBindings } from "./effect-call.ts";

function isUndefined(
  sourceCode: SourceCode,
  node: ESTree.CallExpression["arguments"][number] | undefined,
): boolean {
  if (node === undefined || node.type === "SpreadElement") return false;
  if (node.type === "Identifier") return isGlobalIdentifier(sourceCode, node, "undefined");
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
    const effect = moduleBindings("effect/Effect", "Effect");
    return {
      CallExpression(node) {
        if (
          isModuleCall(context.sourceCode, node.callee, effect, "succeed") &&
          isUndefined(context.sourceCode, node.arguments[0])
        ) {
          context.report({ node, messageId: "preferVoid" });
        }
      },
    };
  },
});
