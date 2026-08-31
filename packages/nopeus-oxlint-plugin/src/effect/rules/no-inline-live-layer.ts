import { defineRule, type ESTree, type SourceCode } from "@oxlint/plugins";

import { isModuleCall, moduleBindings } from "./effect-call.ts";

const liveConstructors = [
  "effect",
  "effectContext",
  "effectDiscard",
  "sync",
  "syncContext",
  "unwrap",
] as const;

function unwrapExpression(expression: ESTree.Expression): ESTree.Expression {
  let current = expression;
  while (
    current.type === "ParenthesizedExpression" ||
    current.type === "TSAsExpression" ||
    current.type === "TSSatisfiesExpression" ||
    current.type === "TSTypeAssertion" ||
    current.type === "TSNonNullExpression"
  ) {
    current = current.expression;
  }
  return current;
}

function isInlineLayer(
  sourceCode: SourceCode,
  argument: ESTree.CallExpression["arguments"][number] | undefined,
  layer: ReturnType<typeof moduleBindings>,
): boolean {
  if (argument === undefined || argument.type === "SpreadElement") return false;
  const current = unwrapExpression(argument);
  if (current.type !== "CallExpression") return false;
  if (liveConstructors.some((name) => isModuleCall(sourceCode, current.callee, layer, name))) {
    return true;
  }
  if (current.arguments.some((child) => isInlineLayer(sourceCode, child, layer))) {
    return true;
  }
  const callee = current.callee;
  return (
    callee.type === "MemberExpression" &&
    callee.object.type !== "Super" &&
    isInlineLayer(sourceCode, callee.object, layer)
  );
}

/** Keep live Layer construction at stable module composition boundaries. */
export const noInlineLiveLayerRule = defineRule({
  meta: {
    type: "problem",
    docs: { description: "Disallow constructing live Layers inside Effect.provide calls." },
    messages: {
      extractLayer:
        "Extract this live Layer to a module-level binding and provide it at the application boundary.",
    },
  },
  createOnce(context) {
    const effect = moduleBindings("effect/Effect", "Effect");
    const layer = moduleBindings("effect/Layer", "Layer");
    return {
      CallExpression(node) {
        if (!isModuleCall(context.sourceCode, node.callee, effect, "provide")) return;
        if (node.arguments.some((argument) => isInlineLayer(context.sourceCode, argument, layer))) {
          context.report({ node, messageId: "extractLayer" });
        }
      },
    };
  },
});
