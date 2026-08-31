import { defineRule, type ESTree } from "@oxlint/plugins";

function importedName(specifier: ESTree.ImportSpecifier): string {
  return specifier.imported.type === "Identifier"
    ? specifier.imported.name
    : specifier.imported.value;
}

function staticName(
  argument: ESTree.CallExpression["arguments"][number] | undefined,
): string | null {
  if (argument === undefined || argument.type === "SpreadElement") return null;
  if (argument.type === "Literal") {
    return typeof argument.value === "string" ? argument.value : null;
  }
  if (argument.type === "TemplateLiteral" && argument.expressions.length === 0) {
    return argument.quasis[0]?.value.cooked ?? argument.quasis[0]?.value.raw ?? "";
  }
  return null;
}

function propertyName(key: ESTree.PropertyKey): string | null {
  if (key.type === "Identifier" || key.type === "PrivateIdentifier") return key.name;
  return key.type === "Literal" && typeof key.value === "string" ? key.value : null;
}

function ownerName(node: ESTree.CallExpression): string | null {
  let current: ESTree.Node = node;
  while (current.parent.type === "CallExpression" && current.parent.callee === current) {
    current = current.parent;
  }

  const owner = current.parent;
  if (owner.type === "VariableDeclarator" && owner.id.type === "Identifier") {
    return owner.id.name;
  }
  if (
    (owner.type === "Property" ||
      owner.type === "PropertyDefinition" ||
      owner.type === "AccessorProperty") &&
    owner.value === current
  ) {
    return propertyName(owner.key);
  }
  return null;
}

function nameMatchesOwner(name: string, owner: string): boolean {
  return name === owner || name.endsWith("." + owner);
}

/** Require traced Effect functions to carry a stable operation name. */
export const requireEffectFnNameRule = defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Require every Effect.fn call to provide a static operation name.",
    },
    messages: {
      missingName:
        "Give this Effect.fn a static operation name so traces and diagnostics identify the workflow.",
      mismatchedName:
        'Effect.fn name "{{name}}" must match its owning symbol "{{owner}}" or end with ".{{owner}}".',
    },
  },
  createOnce(context) {
    const effectNamespaces = new Set<string>();
    const effectFnBindings = new Set<string>();

    return {
      ImportDeclaration(node) {
        if (node.source.value === "effect") {
          for (const specifier of node.specifiers) {
            if (specifier.type === "ImportSpecifier" && importedName(specifier) === "Effect") {
              effectNamespaces.add(specifier.local.name);
            }
          }
          return;
        }

        if (node.source.value !== "effect/Effect") return;
        for (const specifier of node.specifiers) {
          if (specifier.type === "ImportNamespaceSpecifier") {
            effectNamespaces.add(specifier.local.name);
            continue;
          }
          if (specifier.type === "ImportSpecifier" && importedName(specifier) === "fn") {
            effectFnBindings.add(specifier.local.name);
          }
        }
      },
      CallExpression(node) {
        const callee = node.callee;
        const isEffectFn =
          (callee.type === "Identifier" && effectFnBindings.has(callee.name)) ||
          (callee.type === "MemberExpression" &&
            !callee.computed &&
            callee.object.type === "Identifier" &&
            effectNamespaces.has(callee.object.name) &&
            callee.property.type === "Identifier" &&
            callee.property.name === "fn");

        if (!isEffectFn) return;
        const name = staticName(node.arguments[0]);
        if (name === null) {
          context.report({ node: callee, messageId: "missingName" });
          return;
        }
        const owner = ownerName(node);
        if (owner !== null && !nameMatchesOwner(name, owner)) {
          context.report({
            node: node.arguments[0] ?? callee,
            messageId: "mismatchedName",
            data: { name, owner },
          });
        }
      },
    };
  },
});
