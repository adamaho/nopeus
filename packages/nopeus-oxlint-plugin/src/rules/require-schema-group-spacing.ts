import { defineRule, type ESTree } from "@oxlint/plugins";

function variableDeclaration(
  statement: ESTree.Program["body"][number],
): ESTree.VariableDeclaration | null {
  if (statement.type === "VariableDeclaration") return statement;
  if (
    statement.type === "ExportNamedDeclaration" &&
    statement.declaration?.type === "VariableDeclaration"
  ) {
    return statement.declaration;
  }
  return null;
}

function schemaMethod(expression: ESTree.Expression): string | null {
  if (expression.type === "CallExpression") return schemaMethod(expression.callee);
  if (expression.type !== "MemberExpression" || expression.computed) return null;
  if (expression.object.type === "Identifier" && expression.object.name === "Schema") {
    return expression.property.type === "Identifier" ? expression.property.name : null;
  }
  return schemaMethod(expression.object);
}

function isSchemaDeclaration(statement: ESTree.Program["body"][number]): boolean {
  const declaration = variableDeclaration(statement);
  if (declaration?.kind !== "const" || declaration.declarations.length !== 1) return false;
  const initializer = declaration.declarations[0]?.init;
  if (initializer === undefined || initializer === null) return false;
  const method = schemaMethod(initializer);
  return (
    method !== null && (method === "decodeTo" || !/^(?:decode|encode|make|is|assert)/u.test(method))
  );
}

/** Keep top-level schema declarations visually distinct from preceding declarations. */
export const requireSchemaGroupSpacingRule = defineRule({
  meta: {
    type: "layout",
    docs: {
      description:
        "Require a blank line before top-level Schema declarations while grouping decoders with their schema.",
    },
    schema: [],
    messages: {
      separate: "Separate this schema declaration from the preceding statement with a blank line.",
    },
  },
  createOnce(context) {
    return {
      Program(node) {
        const statements = node.body;
        for (let index = 1; index < statements.length; index++) {
          const previous = statements[index - 1];
          const current = statements[index];
          if (previous === undefined || current === undefined) continue;
          if (previous.type === "ImportDeclaration" || !isSchemaDeclaration(current)) continue;

          const between = context.sourceCode.text.slice(previous.range[1], current.range[0]);
          if (!/\r?\n[\t ]*\r?\n/u.test(between)) {
            context.report({ node: current, messageId: "separate" });
          }
        }
      },
    };
  },
});
