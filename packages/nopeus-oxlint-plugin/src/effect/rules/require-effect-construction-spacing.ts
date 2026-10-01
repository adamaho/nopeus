import { defineRule, type ESTree, type SourceCode } from "@oxlint/plugins";

import { isModuleCall, moduleBindings } from "./effect-call.ts";

const layer = moduleBindings("effect/Layer", "Layer");
const context = moduleBindings("effect/Context", "Context");
const effect = moduleBindings("effect/Effect", "Effect");

function moduleCallName(
  sourceCode: SourceCode,
  callee: ESTree.CallExpression["callee"],
  bindings: ReturnType<typeof moduleBindings>,
): string | null {
  const name =
    callee.type === "Identifier"
      ? callee.name
      : callee.type === "MemberExpression" &&
          !callee.computed &&
          callee.property.type === "Identifier"
        ? callee.property.name
        : null;
  return name !== null && isModuleCall(sourceCode, callee, bindings, name) ? name : null;
}

function containsLayerOrServiceCall(
  sourceCode: SourceCode,
  expression: ESTree.Expression,
): boolean {
  if (expression.type === "CallExpression") {
    const callee = expression.callee;
    if (moduleCallName(sourceCode, callee, layer) !== null) return true;
    const serviceName = moduleCallName(sourceCode, callee, context);
    if (serviceName === "Service" || serviceName === "Tag") return true;
    if (moduleCallName(sourceCode, callee, effect) === "Service") return true;
    return (
      (callee.type === "CallExpression" && containsLayerOrServiceCall(sourceCode, callee)) ||
      (callee.type === "MemberExpression" &&
        callee.object.type !== "Super" &&
        containsLayerOrServiceCall(sourceCode, callee.object)) ||
      expression.arguments.some(
        (argument) =>
          argument.type !== "SpreadElement" && containsLayerOrServiceCall(sourceCode, argument),
      )
    );
  }
  if (expression.type === "MemberExpression") {
    return (
      expression.object.type !== "Super" &&
      containsLayerOrServiceCall(sourceCode, expression.object)
    );
  }
  if (
    expression.type === "ParenthesizedExpression" ||
    expression.type === "TSAsExpression" ||
    expression.type === "TSSatisfiesExpression" ||
    expression.type === "TSTypeAssertion" ||
    expression.type === "TSNonNullExpression"
  ) {
    return containsLayerOrServiceCall(sourceCode, expression.expression);
  }
  return false;
}

function declaration(statement: ESTree.Program["body"][number]): ESTree.Statement {
  return statement.type === "ExportNamedDeclaration" && statement.declaration !== null
    ? statement.declaration
    : statement;
}

function schemaMethod(expression: ESTree.Expression): string | null {
  if (expression.type === "CallExpression") return schemaMethod(expression.callee);
  if (expression.type !== "MemberExpression" || expression.computed) return null;
  if (expression.object.type === "Identifier" && expression.object.name === "Schema") {
    return expression.property.type === "Identifier" ? expression.property.name : null;
  }
  return schemaMethod(expression.object);
}

function isSchemaDeclaration(statement: ESTree.Statement): boolean {
  if (statement.type !== "VariableDeclaration" || statement.kind !== "const") return false;
  if (statement.declarations.length !== 1) return false;
  const initializer = statement.declarations[0]?.init;
  if (initializer === undefined || initializer === null) return false;
  const method = schemaMethod(initializer);
  return (
    method !== null && (method === "decodeTo" || !/^(?:decode|encode|make|is|assert)/u.test(method))
  );
}

function isLayerOrServiceDeclaration(sourceCode: SourceCode, statement: ESTree.Statement): boolean {
  if (statement.type === "ClassDeclaration") {
    return (
      statement.superClass !== null && containsLayerOrServiceCall(sourceCode, statement.superClass)
    );
  }
  if (statement.type !== "VariableDeclaration" || statement.kind !== "const") return false;
  if (statement.declarations.length !== 1) return false;
  const initializer = statement.declarations[0]?.init;
  return (
    initializer !== undefined &&
    initializer !== null &&
    containsLayerOrServiceCall(sourceCode, initializer)
  );
}

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

/** Keep substantial Effect constructions visually distinct. */
export const requireEffectConstructionSpacingRule = defineRule({
  meta: {
    type: "layout",
    docs: {
      description: "Separate Schema and Layer constructions and multiline service methods.",
    },
    schema: [],
    fixable: "whitespace",
    messages: {
      separate: "Separate these constructions with a blank line.",
    },
  },
  createOnce(context) {
    function reportIfAdjacent(previous: ESTree.Statement, current: ESTree.Statement) {
      const between = context.sourceCode.text.slice(previous.range[1], current.range[0]);
      if (/\r?\n[\t ]*\r?\n/u.test(between)) return;
      const lineEnding = between.includes("\r\n") ? "\r\n" : "\n";
      const indentation = /(?:\r?\n)([\t ]*)$/u.exec(between)?.[1] ?? "";
      if (between.trim() !== "") {
        context.report({ node: current, messageId: "separate" });
        return;
      }
      context.report({
        node: current,
        messageId: "separate",
        fix: (fixer) =>
          fixer.replaceTextRange(
            [previous.range[1], current.range[0]],
            lineEnding + lineEnding + indentation,
          ),
      });
    }

    return {
      Program(node) {
        const statements = node.body;
        for (let index = 1; index < statements.length; index++) {
          const previous = statements[index - 1];
          const current = statements[index];
          if (previous === undefined || current === undefined) continue;
          if (previous.type === "ImportDeclaration") continue;
          const previousDeclaration = declaration(previous);
          const currentDeclaration = declaration(current);
          const previousConstructs =
            isSchemaDeclaration(previousDeclaration) ||
            isLayerOrServiceDeclaration(context.sourceCode, previousDeclaration);
          const currentConstructs =
            isSchemaDeclaration(currentDeclaration) ||
            isLayerOrServiceDeclaration(context.sourceCode, currentDeclaration);
          if (
            isSchemaDeclaration(currentDeclaration) ||
            (previousConstructs && currentConstructs)
          ) {
            reportIfAdjacent(previous, current);
          }
        }
      },
      BlockStatement(node) {
        const statements = node.body;
        if (!statements.some(returnsService)) return;
        for (let index = 1; index < statements.length; index++) {
          const previous = statements[index - 1];
          const current = statements[index];
          if (previous?.type !== "VariableDeclaration" || current === undefined) continue;
          if (current.type !== "VariableDeclaration" && !returnsService(current)) continue;
          if (
            previous.loc.start.line === previous.loc.end.line &&
            current.loc.start.line === current.loc.end.line
          )
            continue;
          reportIfAdjacent(previous, current);
        }
      },
    };
  },
});
