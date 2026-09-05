import { defineRule, type ESTree, type SourceCode } from "@oxlint/plugins";

import { isGlobalIdentifier } from "./effect-call.ts";

const collections = new Set(["Map", "Set", "WeakMap", "WeakSet"]);

function isModuleDeclaration(node: ESTree.VariableDeclaration): boolean {
  return (
    node.parent.type === "Program" ||
    (node.parent.type === "ExportNamedDeclaration" && node.parent.parent.type === "Program")
  );
}

function hasReadonlyContract(declarator: ESTree.VariableDeclarator, collection: string): boolean {
  const annotation = declarator.id.typeAnnotation?.typeAnnotation;
  return (
    (collection === "Map" || collection === "Set") &&
    annotation?.type === "TSTypeReference" &&
    annotation.typeName.type === "Identifier" &&
    annotation.typeName.name === "Readonly" + collection
  );
}

function globalCollection(sourceCode: SourceCode, node: ESTree.NewExpression): string | null {
  const callee = node.callee;
  if (callee.type === "Identifier") {
    return collections.has(callee.name) && isGlobalIdentifier(sourceCode, callee, callee.name)
      ? callee.name
      : null;
  }
  if (
    callee.type !== "MemberExpression" ||
    callee.object.type !== "Identifier" ||
    !isGlobalIdentifier(sourceCode, callee.object, "globalThis")
  )
    return null;
  const property = callee.property;
  const name =
    !callee.computed && property.type === "Identifier"
      ? property.name
      : property.type === "Literal" && typeof property.value === "string"
        ? property.value
        : null;
  return name !== null && collections.has(name) ? name : null;
}

function unwrap(node: ESTree.Expression): ESTree.Expression {
  let current = node;
  while (
    current.type === "ParenthesizedExpression" ||
    current.type === "TSSatisfiesExpression" ||
    current.type === "TSAsExpression" ||
    current.type === "TSTypeAssertion"
  )
    current = current.expression;
  return current;
}

/** Allocate service state during construction, allowing explicitly readonly lookup collections. */
export const noModuleLevelMutableStateRule = defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Disallow module-level mutable bindings and writable collection construction.",
    },
    messages: {
      mutableBinding:
        "Allocate mutable state inside make so its lifetime belongs to the constructed service.",
      mutableCollection:
        "Allocate this collection inside make. For an immutable lookup table, expose a ReadonlyMap or ReadonlySet contract.",
    },
  },
  createOnce(context) {
    return {
      VariableDeclaration(node) {
        if (!isModuleDeclaration(node) || node.declare) return;
        if (node.kind === "let" || node.kind === "var") {
          context.report({ node, messageId: "mutableBinding" });
          return;
        }
        for (const declarator of node.declarations) {
          if (declarator.init === null) continue;
          const value = unwrap(declarator.init);
          if (value.type !== "NewExpression") continue;
          const collection = globalCollection(context.sourceCode, value);
          if (collection === null || hasReadonlyContract(declarator, collection)) continue;
          context.report({ node: value, messageId: "mutableCollection" });
        }
      },
    };
  },
});
