import { defineRule, type ESTree } from "@oxlint/plugins";

import { isModuleCall, moduleBindings } from "./effect-call.ts";

function staticString(
  argument: ESTree.CallExpression["arguments"][number] | undefined,
): string | null {
  if (argument === undefined || argument.type === "SpreadElement") return null;
  let current = argument;
  while (current.type === "ParenthesizedExpression" || current.type === "TSSatisfiesExpression") {
    current = current.expression;
  }
  if (current.type === "Literal") {
    return typeof current.value === "string" ? current.value : null;
  }
  if (current.type === "TemplateLiteral" && current.expressions.length === 0) {
    return current.quasis[0]?.value.cooked ?? current.quasis[0]?.value.raw ?? "";
  }
  return null;
}

/** Keep Effect service identifiers inside the repository's owned namespace. */
export const requireServiceKeyPrefixRule = defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Require Context.Service and Context.Reference keys to use a configured static prefix.",
    },
    schema: [
      {
        type: "object",
        properties: {
          prefix: { type: "string", minLength: 1 },
        },
        required: ["prefix"],
        additionalProperties: false,
      },
    ],
    defaultOptions: [{ prefix: "@" }],
    messages: {
      staticKey:
        "Give this Context service/reference a static string key inside the repository namespace.",
      wrongPrefix:
        'Service key "{{key}}" must begin with the owned prefix "{{prefix}}" and include a name.',
    },
  },
  createOnce(context) {
    const checkKey = (
      node: ESTree.CallExpression,
      keyArgument: ESTree.CallExpression["arguments"][number] | undefined,
    ) => {
      const key = staticString(keyArgument);
      if (key === null) {
        context.report({ node, messageId: "staticKey" });
        return;
      }

      const option = context.options?.[0];
      const prefix =
        typeof option === "object" &&
        option !== null &&
        !Array.isArray(option) &&
        typeof option.prefix === "string"
          ? option.prefix
          : "@";

      if (key.startsWith(prefix) && key.length > prefix.length) return;
      context.report({
        node: keyArgument ?? node,
        messageId: "wrongPrefix",
        data: { key, prefix },
      });
    };

    return {
      CallExpression(node) {
        const matches = (callee: ESTree.CallExpression["callee"], name: string) =>
          isModuleCall(
            context.sourceCode,
            callee,
            moduleBindings("effect/Context", "Context"),
            name,
          );
        if (matches(node.callee, "Reference")) {
          checkKey(node, node.arguments[0]);
          return;
        }
        if (
          node.callee.type === "CallExpression" &&
          matches(node.callee.callee, "Service") &&
          node.callee.arguments.length === 0
        ) {
          checkKey(node, node.arguments[0]);
          return;
        }
        if (!matches(node.callee, "Service")) return;
        if (
          node.arguments.length === 0 &&
          node.parent.type === "CallExpression" &&
          node.parent.callee === node
        )
          return;
        checkKey(node, node.arguments[0]);
      },
    };
  },
});
