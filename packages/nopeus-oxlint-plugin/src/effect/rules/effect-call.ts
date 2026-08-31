import type { ESTree } from "@oxlint/plugins";

export interface ModuleBindings {
  readonly namespaces: Set<string>;
  readonly named: Map<string, Set<string>>;
}

/** Create mutable import bindings for one Effect module. */
export function moduleBindings(): ModuleBindings {
  return { namespaces: new Set(), named: new Map() };
}

function importedName(specifier: ESTree.ImportSpecifier): string {
  return specifier.imported.type === "Identifier"
    ? specifier.imported.name
    : specifier.imported.value;
}

/** Record namespace and named imports from an Effect module. */
export function recordModuleImport(
  node: ESTree.ImportDeclaration,
  moduleName: string,
  barrelName: string,
  bindings: ModuleBindings,
): void {
  if (node.source.value === "effect") {
    for (const specifier of node.specifiers) {
      if (specifier.type === "ImportSpecifier" && importedName(specifier) === barrelName) {
        bindings.namespaces.add(specifier.local.name);
      }
    }
    return;
  }

  if (node.source.value !== moduleName) return;
  for (const specifier of node.specifiers) {
    if (specifier.type === "ImportNamespaceSpecifier") {
      bindings.namespaces.add(specifier.local.name);
      continue;
    }
    if (specifier.type !== "ImportSpecifier") continue;
    const imported = importedName(specifier);
    const locals = bindings.named.get(imported) ?? new Set<string>();
    locals.add(specifier.local.name);
    bindings.named.set(imported, locals);
  }
}

/** Test whether a callee is a tracked Effect module function. */
export function isModuleCall(
  callee: ESTree.CallExpression["callee"],
  bindings: ModuleBindings,
  name: string,
): boolean {
  if (callee.type === "Identifier") return bindings.named.get(name)?.has(callee.name) === true;
  return (
    callee.type === "MemberExpression" &&
    !callee.computed &&
    callee.object.type === "Identifier" &&
    bindings.namespaces.has(callee.object.name) &&
    callee.property.type === "Identifier" &&
    callee.property.name === name
  );
}
