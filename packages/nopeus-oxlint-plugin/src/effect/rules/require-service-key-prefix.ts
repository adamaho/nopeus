import { defineRule, type ESTree } from "@oxlint/plugins";

function importedName(specifier: ESTree.ImportSpecifier): string {
  return specifier.imported.type === "Identifier"
    ? specifier.imported.name
    : specifier.imported.value;
}

function isServiceFactory(
  callee: ESTree.CallExpression["callee"],
  contextNamespaces: ReadonlySet<string>,
  serviceBindings: ReadonlySet<string>,
): boolean {
  if (callee.type === "Identifier") return serviceBindings.has(callee.name);
  return (
    callee.type === "MemberExpression" &&
    !callee.computed &&
    callee.object.type === "Identifier" &&
    contextNamespaces.has(callee.object.name) &&
    callee.property.type === "Identifier" &&
    callee.property.name === "Service"
  );
}

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
      description: "Require Context.Service keys to use a configured static prefix.",
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
      staticKey: "Give this Context.Service a static string key inside the repository namespace.",
      wrongPrefix: 'Service key "{{key}}" must begin with the owned prefix "{{prefix}}".',
    },
  },
  createOnce(context) {
    const contextNamespaces = new Set<string>();
    const serviceBindings = new Set<string>();

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

      if (key.startsWith(prefix)) return;
      context.report({
        node: keyArgument ?? node,
        messageId: "wrongPrefix",
        data: { key, prefix },
      });
    };

    return {
      ImportDeclaration(node) {
        if (node.source.value === "effect") {
          for (const specifier of node.specifiers) {
            if (specifier.type === "ImportSpecifier" && importedName(specifier) === "Context") {
              contextNamespaces.add(specifier.local.name);
            }
          }
          return;
        }

        if (node.source.value !== "effect/Context") return;
        for (const specifier of node.specifiers) {
          if (specifier.type === "ImportNamespaceSpecifier") {
            contextNamespaces.add(specifier.local.name);
            continue;
          }
          if (specifier.type === "ImportSpecifier" && importedName(specifier) === "Service") {
            serviceBindings.add(specifier.local.name);
          }
        }
      },
      CallExpression(node) {
        if (
          node.callee.type === "CallExpression" &&
          isServiceFactory(node.callee.callee, contextNamespaces, serviceBindings)
        ) {
          checkKey(node, node.arguments[0]);
          return;
        }

        if (!isServiceFactory(node.callee, contextNamespaces, serviceBindings)) return;
        if (node.parent.type === "CallExpression" && node.parent.callee === node) return;
        checkKey(node, node.arguments[0]);
      },
    };
  },
});
