import { defineRule, type ESTree } from "@oxlint/plugins";

function importedName(specifier: ESTree.ImportSpecifier): string {
  return specifier.imported.type === "Identifier"
    ? specifier.imported.name
    : specifier.imported.value;
}

function isStaticName(argument: ESTree.CallExpression["arguments"][number] | undefined): boolean {
  if (argument === undefined || argument.type === "SpreadElement") return false;
  if (argument.type === "Literal") return typeof argument.value === "string";
  return argument.type === "TemplateLiteral" && argument.expressions.length === 0;
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

        if (!isEffectFn || isStaticName(node.arguments[0])) return;
        context.report({ node: callee, messageId: "missingName" });
      },
    };
  },
});
