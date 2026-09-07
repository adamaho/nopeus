import type { ESTree, SourceCode } from "@oxlint/plugins";

function isUnshadowedRequire(sourceCode: SourceCode, node: ESTree.IdentifierReference): boolean {
  let scope = sourceCode.getScope(node);
  while (true) {
    const variable = scope.set.get("require");
    if (variable) return variable.defs.length === 0;
    if (!scope.upper) return true;
    scope = scope.upper;
  }
}

/** Visit literal module references, including re-exports and type-only imports. */
export function importSources(
  sourceCode: () => SourceCode,
  check: (node: ESTree.Node, specifier: string) => void,
) {
  return {
    TSImportType(node: ESTree.TSImportType) {
      check(node.source, node.source.value);
    },
    TSExternalModuleReference(node: ESTree.TSExternalModuleReference) {
      check(node.expression, node.expression.value);
    },
    ImportDeclaration(node: ESTree.ImportDeclaration) {
      check(node.source, node.source.value);
    },
    ExportNamedDeclaration(node: ESTree.ExportNamedDeclaration) {
      if (node.source) check(node.source, node.source.value);
    },
    ExportAllDeclaration(node: ESTree.ExportAllDeclaration) {
      check(node.source, node.source.value);
    },
    ImportExpression(node: ESTree.ImportExpression) {
      if (node.source.type === "Literal" && typeof node.source.value === "string") {
        check(node.source, node.source.value);
      }
    },
    CallExpression(node: ESTree.CallExpression) {
      const first = node.arguments[0];
      if (
        node.callee.type === "Identifier" &&
        node.callee.name === "require" &&
        isUnshadowedRequire(sourceCode(), node.callee) &&
        first?.type === "Literal" &&
        typeof first.value === "string"
      ) {
        check(first, first.value);
      }
    },
  };
}
