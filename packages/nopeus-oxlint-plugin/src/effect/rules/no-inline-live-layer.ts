import { defineRule, type ESTree } from "@oxlint/plugins";

import { isModuleCall, moduleBindings, recordModuleImport } from "./effect-call.ts";

const liveConstructors = new Set(["effect", "scoped", "sync", "succeed", "unwrap"]);

function isInlineLayer(
  argument: ESTree.CallExpression["arguments"][number] | undefined,
  layer: ReturnType<typeof moduleBindings>,
): boolean {
  if (argument === undefined || argument.type === "SpreadElement") return false;
  let current = argument;
  while (current.type === "ParenthesizedExpression" || current.type === "TSSatisfiesExpression") {
    current = current.expression;
  }
  return (
    current.type === "CallExpression" &&
    [...liveConstructors].some((name) => isModuleCall(current.callee, layer, name))
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
    const effect = moduleBindings();
    const layer = moduleBindings();
    return {
      ImportDeclaration(node) {
        recordModuleImport(node, "effect/Effect", "Effect", effect);
        recordModuleImport(node, "effect/Layer", "Layer", layer);
      },
      CallExpression(node) {
        if (!isModuleCall(node.callee, effect, "provide")) return;
        if (node.arguments.some((argument) => isInlineLayer(argument, layer))) {
          context.report({ node, messageId: "extractLayer" });
        }
      },
    };
  },
});
