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

// Each entry identifies a runtime name, never an arbitrary string parameter.
const directNames = [
  ["Context", "Reference"],
  ["Effect", "fn"],
  ["Effect", "makeSpan"],
  ["Effect", "makeSpanScoped"],
  ["Effect", "useSpan"],
  ["Layer", "span"],
  ["Schema", "Class"],
  ["Schema", "Error"],
  ["Schema", "TaggedStruct"],
  ["Data", "TaggedClass"],
  ["Data", "TaggedError"],
  ["Request", "tagged"],
  ["Request", "TaggedClass"],
  ["Metric", "timer"],
  ["Metric", "counter"],
  ["Metric", "gauge"],
  ["Metric", "frequency"],
  ["Metric", "histogram"],
  ["Metric", "summary"],
  ["Metric", "summaryWithTimestamp"],
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

/** Require application-owned Effect runtime identifiers to share one namespace. */
export const requireEffectNamespaceRule = defineRule({
  meta: {
    type: "problem",
    docs: { description: "Require static, repository-prefixed Effect runtime identifiers." },
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
      staticKey: "Give {{api}} a static string identifier inside the repository namespace.",
      wrongPrefix:
        '{{api}} identifier "{{key}}" must begin with the owned prefix "{{prefix}}" and include a name.',
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
      if (key.startsWith(prefix) && key.length > prefix.length) return;
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
        if (matches(node.callee, "Context", "Service")) {
          if (
            node.arguments.length > 0 ||
            node.parent.type !== "CallExpression" ||
            node.parent.callee !== node
          )
            check(node, 0, "Context.Service");
          return;
        }
        for (const name of ["TaggedClass", "TaggedError"]) {
          if (matches(node.callee, "Schema", name)) {
            // An omitted identifier defaults to the second-stage tag, which is checked below.
            if (node.arguments.length > 0) check(node, 0, "Schema." + name);
            return;
          }
        }
        if (node.callee.type === "CallExpression") {
          if (
            matches(node.callee.callee, "Context", "Service") &&
            node.callee.arguments.length === 0
          ) {
            check(node, 0, "Context.Service");
          }
          for (const name of ["TaggedClass", "TaggedError"]) {
            if (matches(node.callee.callee, "Schema", name)) check(node, 0, "Schema." + name);
          }
          return;
        }
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
