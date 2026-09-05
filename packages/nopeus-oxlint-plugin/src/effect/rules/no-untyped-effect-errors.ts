import { defineRule, type ESTree, type SourceCode } from "@oxlint/plugins";

import { isGlobalIdentifier, isModuleCall, moduleBindings } from "./effect-call.ts";

const builtInErrors = new Set([
  "AggregateError",
  "Error",
  "EvalError",
  "RangeError",
  "ReferenceError",
  "SyntaxError",
  "TypeError",
  "URIError",
]);

function unwrap(
  node: ESTree.CallExpression["arguments"][number] | undefined,
): Exclude<ESTree.CallExpression["arguments"][number], ESTree.SpreadElement> | undefined {
  if (node === undefined || node.type === "SpreadElement") return undefined;
  let current = node;
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

function memberName(node: ESTree.MemberExpression): string | null {
  if (!node.computed && node.property.type === "Identifier") return node.property.name;
  return node.computed &&
    node.property.type === "Literal" &&
    typeof node.property.value === "string"
    ? node.property.value
    : null;
}

function isGlobalBuiltInError(sourceCode: SourceCode, callee: ESTree.Expression): boolean {
  if (callee.type === "Identifier") {
    return builtInErrors.has(callee.name) && isGlobalIdentifier(sourceCode, callee, callee.name);
  }
  if (
    callee.type !== "MemberExpression" ||
    callee.object.type !== "Identifier" ||
    !isGlobalIdentifier(sourceCode, callee.object, "globalThis")
  ) {
    return false;
  }
  const name = memberName(callee);
  return name !== null && builtInErrors.has(name);
}

function isUntypedError(
  sourceCode: SourceCode,
  node: ESTree.CallExpression["arguments"][number] | undefined,
): boolean {
  const argument = unwrap(node);
  if (argument === undefined) return false;
  if (
    argument.type === "Literal" ||
    argument.type === "TemplateLiteral" ||
    argument.type === "ObjectExpression" ||
    (argument.type === "Identifier" && isGlobalIdentifier(sourceCode, argument, "undefined")) ||
    (argument.type === "UnaryExpression" && argument.operator === "void")
  ) {
    return true;
  }
  if (argument.type !== "NewExpression" && argument.type !== "CallExpression") return false;
  const callee = argument.callee;
  return (
    callee.type !== "Super" &&
    callee.type !== "V8IntrinsicExpression" &&
    isGlobalBuiltInError(sourceCode, callee)
  );
}

/** Keep expected failures in explicit domain error types. */
export const noUntypedEffectErrorsRule = defineRule({
  meta: {
    type: "problem",
    docs: { description: "Reject untyped values and built-in errors in Effect.fail." },
    messages: {
      domainError:
        "Fail with a tagged domain error (for example Schema.TaggedError), not a primitive or built-in Error.",
    },
  },
  createOnce(context) {
    const effect = moduleBindings("effect/Effect", "Effect");
    return {
      CallExpression(node) {
        if (
          isModuleCall(context.sourceCode, node.callee, effect, "fail") &&
          isUntypedError(context.sourceCode, node.arguments[0])
        ) {
          context.report({ node, messageId: "domainError" });
        }
      },
    };
  },
});
