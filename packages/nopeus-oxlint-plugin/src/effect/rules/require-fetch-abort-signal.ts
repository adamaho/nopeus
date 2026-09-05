import { defineRule, type ESTree, type SourceCode } from "@oxlint/plugins";

import { isGlobalIdentifier, isModuleCall, moduleBindings } from "./effect-call.ts";

type Callback = ESTree.ArrowFunctionExpression | ESTree.Function;
type ObjectProperty = Extract<ESTree.ObjectExpression["properties"][number], { type: "Property" }>;

function propertyName(node: ObjectProperty | ESTree.MemberExpression): string | null {
  const key = node.type === "Property" ? node.key : node.property;
  if (!node.computed && key.type === "Identifier") return key.name;
  return key.type === "Literal" && typeof key.value === "string" ? key.value : null;
}

function isFetch(sourceCode: SourceCode, callee: ESTree.CallExpression["callee"]): boolean {
  if (callee.type === "Identifier") return isGlobalIdentifier(sourceCode, callee, "fetch");
  return (
    callee.type === "MemberExpression" &&
    callee.object.type === "Identifier" &&
    isGlobalIdentifier(sourceCode, callee.object, "globalThis") &&
    propertyName(callee) === "fetch"
  );
}

function tryPromiseCallback(sourceCode: SourceCode, node: ESTree.Node): Callback | null {
  let current = node.parent;
  while (current !== null && current.type !== "Program") {
    if (current.type === "FunctionDeclaration") return null;
    if (current.type === "ArrowFunctionExpression" || current.type === "FunctionExpression") {
      let owner: ESTree.Node = current;
      if (
        owner.parent.type === "Property" &&
        owner.parent.value === owner &&
        propertyName(owner.parent) === "try" &&
        owner.parent.parent.type === "ObjectExpression"
      ) {
        owner = owner.parent.parent;
      }
      const parent = owner.parent;
      return parent.type === "CallExpression" &&
        parent.arguments[0] === owner &&
        isModuleCall(
          sourceCode,
          parent.callee,
          moduleBindings("effect/Effect", "Effect"),
          "tryPromise",
        )
        ? current
        : null;
    }
    current = current.parent;
  }
  return null;
}

function isCallbackSignal(
  sourceCode: SourceCode,
  value: ESTree.Expression,
  callback: Callback,
): boolean {
  const parameter = callback.params[0];
  if (parameter?.type !== "Identifier" || value.type !== "Identifier") return false;
  let scope = sourceCode.getScope(value);
  while (true) {
    const variable = scope.set.get(value.name);
    if (variable !== undefined) {
      return variable.defs.some(
        (definition) => definition.type === "Parameter" && definition.name === parameter,
      );
    }
    if (scope.upper === null) return false;
    scope = scope.upper;
  }
}

function forwardsSignal(
  sourceCode: SourceCode,
  options: ESTree.CallExpression["arguments"][number] | undefined,
  callback: Callback,
): boolean {
  if (options?.type !== "ObjectExpression") return false;
  // Later properties/spreads can overwrite a previously forwarded signal.
  for (let index = options.properties.length - 1; index >= 0; index--) {
    const property = options.properties[index];
    if (property === undefined || property.type === "SpreadElement") return false;
    const name = propertyName(property);
    if (name === null) return false;
    if (name === "signal") return isCallbackSignal(sourceCode, property.value, callback);
  }
  return false;
}

/** Forward Effect interruption to global fetch at a direct Promise adapter boundary. */
export const requireFetchAbortSignalRule = defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Require global fetch in Effect.tryPromise callbacks to forward their AbortSignal.",
    },
    messages: {
      missingSignal:
        "Forward the Effect.tryPromise callback's signal with fetch(url, { ...options, signal }) so interruption cancels the request.",
    },
  },
  createOnce(context) {
    return {
      CallExpression(node) {
        if (!isFetch(context.sourceCode, node.callee)) return;
        const callback = tryPromiseCallback(context.sourceCode, node);
        if (callback === null || forwardsSignal(context.sourceCode, node.arguments[1], callback))
          return;
        context.report({ node, messageId: "missingSignal" });
      },
    };
  },
});
