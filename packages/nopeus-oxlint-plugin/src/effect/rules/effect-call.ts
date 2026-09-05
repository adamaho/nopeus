import type { ESTree, Scope, SourceCode, Variable } from "@oxlint/plugins";

export interface ModuleBindings {
  readonly barrelName: string;
  readonly moduleName: string;
}

/** Describe the barrel and direct module imports for one Effect module. */
export function moduleBindings(moduleName: string, barrelName: string): ModuleBindings {
  return { barrelName, moduleName };
}

function importedName(specifier: ESTree.ImportSpecifier): string {
  return specifier.imported.type === "Identifier"
    ? specifier.imported.name
    : specifier.imported.value;
}

function resolveVariable(
  sourceCode: SourceCode,
  identifier: ESTree.IdentifierReference,
): Variable | null {
  let scope: Scope | null = sourceCode.getScope(identifier);
  while (scope !== null) {
    const variable = scope.set.get(identifier.name);
    if (variable !== undefined) return variable;
    scope = scope.upper;
  }
  return null;
}

/** Test whether an identifier resolves to one global binding. */
export function isGlobalIdentifier(
  sourceCode: SourceCode,
  identifier: ESTree.IdentifierReference,
  name: string,
): boolean {
  if (identifier.name !== name) return false;
  if (sourceCode.isGlobalReference(identifier)) return true;
  const variable = resolveVariable(sourceCode, identifier);
  return variable === null || variable.defs.length === 0;
}

function isNamedModuleImport(
  sourceCode: SourceCode,
  identifier: ESTree.IdentifierReference,
  bindings: ModuleBindings,
  name: string,
): boolean {
  const variable = resolveVariable(sourceCode, identifier);
  return (
    variable?.defs.some(
      (definition) =>
        definition.type === "ImportBinding" &&
        definition.parent?.type === "ImportDeclaration" &&
        definition.parent.source.value === bindings.moduleName &&
        definition.node.type === "ImportSpecifier" &&
        importedName(definition.node) === name,
    ) === true
  );
}

function isModuleNamespace(
  sourceCode: SourceCode,
  identifier: ESTree.IdentifierReference,
  bindings: ModuleBindings,
): boolean {
  const variable = resolveVariable(sourceCode, identifier);
  return (
    variable?.defs.some((definition) => {
      if (definition.type !== "ImportBinding" || definition.parent?.type !== "ImportDeclaration") {
        return false;
      }
      if (definition.parent.source.value === bindings.moduleName) {
        return definition.node.type === "ImportNamespaceSpecifier";
      }
      return (
        definition.parent.source.value === "effect" &&
        definition.node.type === "ImportSpecifier" &&
        importedName(definition.node) === bindings.barrelName
      );
    }) === true
  );
}

/** Test whether a type name resolves to an imported Effect module type. */
export function isModuleType(
  sourceCode: SourceCode,
  typeName: ESTree.TSTypeName,
  bindings: ModuleBindings,
  name: string,
): boolean {
  if (typeName.type === "Identifier") {
    return isNamedModuleImport(sourceCode, typeName, bindings, name);
  }
  return (
    typeName.type === "TSQualifiedName" &&
    typeName.left.type === "Identifier" &&
    isModuleNamespace(sourceCode, typeName.left, bindings) &&
    typeName.right.name === name
  );
}

/** Test whether a callee resolves to an imported Effect module function. */
export function isModuleCall(
  sourceCode: SourceCode,
  callee: ESTree.CallExpression["callee"],
  bindings: ModuleBindings,
  name: string,
): boolean {
  if (callee.type === "Identifier") {
    return isNamedModuleImport(sourceCode, callee, bindings, name);
  }
  return (
    callee.type === "MemberExpression" &&
    !callee.computed &&
    callee.object.type === "Identifier" &&
    isModuleNamespace(sourceCode, callee.object, bindings) &&
    callee.property.type === "Identifier" &&
    callee.property.name === name
  );
}
