import { defineRule, type ESTree } from "@oxlint/plugins";

import { isModuleCall, moduleBindings, recordModuleImport } from "./effect-call.ts";

function unwrap(
  node: ESTree.CallExpression["arguments"][number] | undefined,
): Exclude<ESTree.CallExpression["arguments"][number], ESTree.SpreadElement> | undefined {
  if (node === undefined || node.type === "SpreadElement") return undefined;
  let current = node;
  while (current.type === "ParenthesizedExpression" || current.type === "TSSatisfiesExpression") {
    current = current.expression;
  }
  return current;
}

function isUntypedError(node: ESTree.CallExpression["arguments"][number] | undefined): boolean {
  const argument = unwrap(node);
  if (argument === undefined) return false;
  if (argument.type === "Literal" || argument.type === "TemplateLiteral") return true;
  return (
    argument.type === "NewExpression" &&
    argument.callee.type === "Identifier" &&
    argument.callee.name === "Error"
  );
}

/** Keep expected failures in explicit domain error types. */
export const noUntypedEffectErrorsRule = defineRule({
  meta: {
    type: "problem",
    docs: { description: "Reject primitive and built-in Error values in Effect.fail." },
    messages: {
      domainError:
        "Fail with a tagged domain error (for example Schema.TaggedErrorClass), not a primitive or built-in Error.",
    },
  },
  createOnce(context) {
    const effect = moduleBindings();
    return {
      ImportDeclaration(node) {
        recordModuleImport(node, "effect/Effect", "Effect", effect);
      },
      CallExpression(node) {
        if (isModuleCall(node.callee, effect, "fail") && isUntypedError(node.arguments[0])) {
          context.report({ node, messageId: "domainError" });
        }
      },
    };
  },
});
