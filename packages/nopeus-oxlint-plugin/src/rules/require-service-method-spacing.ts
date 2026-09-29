import { defineRule, type ESTree } from "@oxlint/plugins";

function returnsService(node: ESTree.Statement): boolean {
  if (node.type !== "ReturnStatement" || node.argument?.type !== "CallExpression") return false;

  const callee = node.argument.callee;
  return (
    callee.type === "MemberExpression" &&
    !callee.computed &&
    callee.object.type === "Identifier" &&
    callee.object.name === "Service" &&
    callee.property.type === "Identifier" &&
    callee.property.name === "of"
  );
}

function isMultiline(node: ESTree.Statement): boolean {
  return node.loc.start.line < node.loc.end.line;
}

/** Separate substantial method definitions in service layer factories. */
export const requireServiceMethodSpacingRule = defineRule({
  meta: {
    type: "layout",
    docs: {
      description: "Require blank lines between multiline service methods and before Service.of.",
    },
    schema: [],
    messages: {
      separate: "Separate service method definitions with a blank line.",
    },
  },
  createOnce(context) {
    return {
      BlockStatement(node) {
        const statements = node.body;
        if (!statements.some(returnsService)) return;

        for (let index = 1; index < statements.length; index++) {
          const previous = statements[index - 1];
          const current = statements[index];
          if (previous?.type !== "VariableDeclaration" || current === undefined) continue;
          if (current.type !== "VariableDeclaration" && !returnsService(current)) continue;
          if (!isMultiline(previous) && !isMultiline(current)) continue;

          const between = context.sourceCode.text.slice(previous.range[1], current.range[0]);
          if (!/\r?\n[\t ]*\r?\n/u.test(between)) {
            context.report({ node: current, messageId: "separate" });
          }
        }
      },
    };
  },
});
