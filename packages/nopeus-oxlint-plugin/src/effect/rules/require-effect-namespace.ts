import { defineRule, type ESTree } from "@oxlint/plugins";

import { isModuleCall, moduleBindings } from "./effect-call.ts";

function staticString(
  argument: ESTree.CallExpression["arguments"][number] | undefined,
): string | null {
  if (argument === undefined || argument.type === "SpreadElement") return null;
  let current = argument;
  while (
    current.type === "ParenthesizedExpression" ||
    current.type === "TSSatisfiesExpression" ||
    current.type === "TSAsExpression" ||
    current.type === "TSTypeAssertion"
  ) {
    current = current.expression;
  }
  if (current.type === "Literal") return typeof current.value === "string" ? current.value : null;
  if (current.type === "TemplateLiteral" && current.expressions.length === 0)
    return current.quasis[0]?.value.cooked ?? null;
  return null;
}

// Only APIs that name spans belong here. Data tags and metric names have separate contracts.
const directNames = [
  ["Effect", "fn"],
  ["Effect", "makeSpan"],
  ["Effect", "makeSpanScoped"],
  ["Effect", "useSpan"],
  ["Layer", "span"],
] as const;
const dualNames = [
  ["Effect", "withSpan"],
  ["Effect", "withSpanScoped"],
  ["Effect", "withLogSpan"],
  ["Channel", "withSpan"],
  ["RequestResolver", "withSpan"],
  ["Stream", "withSpan"],
  ["Layer", "withSpan"],
] as const;

/** Require readable, repository-owned names for traced Effect operations. */
export const requireEffectNamespaceRule = defineRule({
  meta: {
    type: "problem",
    docs: { description: "Require static Effect trace names in @project/Domain.operation form." },
    schema: [
      {
        type: "object",
        properties: { prefix: { type: "string", minLength: 1 } },
        required: ["prefix"],
        additionalProperties: false,
      },
    ],
    defaultOptions: [{ prefix: "@" }],
    messages: {
      invalidFormat:
        '{{api}} trace name "{{key}}" must use "{{prefix}}Domain.operation" with PascalCase domain segments and a camelCase operation.',

      staticKey: "Give {{api}} a static trace name inside the repository namespace.",
      wrongPrefix:
        '{{api}} trace name "{{key}}" must begin with the owned prefix "{{prefix}}" and include a name.',
    },
  },
  createOnce(context) {
    const check = (node: ESTree.CallExpression, index: number, api: string) => {
      const argument = node.arguments[index];
      const key = staticString(argument);
      if (key === null) {
        context.report({ node: argument ?? node, messageId: "staticKey", data: { api } });
        return;
      }
      const option = context.options[0];
      const prefix =
        typeof option === "object" &&
        option !== null &&
        !Array.isArray(option) &&
        typeof option.prefix === "string"
          ? option.prefix
          : "@";
      if (key.startsWith(prefix) && key.length > prefix.length) {
        if (/^(?:[A-Z][A-Za-z0-9]*\.)+[a-z][A-Za-z0-9]*$/u.test(key.slice(prefix.length))) return;
        context.report({
          node: argument ?? node,
          messageId: "invalidFormat",
          data: { api, key, prefix },
        });
        return;
      }
      context.report({
        node: argument ?? node,
        messageId: "wrongPrefix",
        data: { api, key, prefix },
      });
    };
    return {
      CallExpression(node) {
        const matches = (callee: ESTree.CallExpression["callee"], module: string, name: string) =>
          isModuleCall(
            context.sourceCode,
            callee,
            moduleBindings("effect/" + module, module),
            name,
          );
        for (const [module, name] of directNames) {
          if (matches(node.callee, module, name)) {
            check(node, 0, module + "." + name);
            return;
          }
        }
        for (const [module, name] of dualNames) {
          if (matches(node.callee, module, name)) {
            const index =
              staticString(node.arguments[0]) !== null
                ? 0
                : staticString(node.arguments[1]) !== null || node.arguments.length >= 3
                  ? 1
                  : 0;
            check(node, index, module + "." + name);
            return;
          }
        }
      },
    };
  },
});
