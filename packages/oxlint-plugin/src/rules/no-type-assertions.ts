import { defineRule, type ESTree } from "@oxlint/plugins";

type TypeAssertion = ESTree.TSAsExpression | ESTree.TSTypeAssertion;

function isConstAssertion(node: TypeAssertion): boolean {
  return (
    node.typeAnnotation.type === "TSTypeReference" &&
    node.typeAnnotation.typeName.type === "Identifier" &&
    node.typeAnnotation.typeName.name === "const"
  );
}

function isNestedAssertion(node: TypeAssertion): boolean {
  return node.parent.type === "TSAsExpression" || node.parent.type === "TSTypeAssertion";
}

/** Reject non-const type assertions instead of allowing a comment-based escape hatch. */
export const noTypeAssertionsRule = defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Reject non-const type assertions; decode unknown input or preserve the type inferred by a typed API.",
    },
    messages: {
      typeAssertion:
        "Type assertions are forbidden. Decode unknown input with Schema, or preserve the type inferred by Effect SQL, Drizzle, or another typed API.",
    },
  },
  createOnce(context) {
    const checkAssertion = (node: TypeAssertion) => {
      if (isConstAssertion(node) || isNestedAssertion(node)) return;
      context.report({ node, messageId: "typeAssertion" });
    };

    return {
      TSAsExpression: checkAssertion,
      TSTypeAssertion: checkAssertion,
    };
  },
});
