import { defineRule, type ESTree, type SourceCode } from "@oxlint/plugins";

import { isModuleCall, moduleBindings, type ModuleBindings } from "./effect-call.ts";

interface ServiceDeclaration {
  readonly name: string;
  readonly node: ESTree.Class;
}

interface LayerPair {
  readonly service: string;
  readonly make: string;
}

const layerConstructors = ["effect", "succeed", "sync"] as const;

function exportName(node: ESTree.ModuleExportName): string {
  return node.type === "Identifier" ? node.name : node.value;
}

function exportedNames(program: ESTree.Program): Set<string> {
  const names = new Set<string>();
  for (const statement of program.body) {
    if (statement.type === "ExportDefaultDeclaration") {
      const declaration = statement.declaration;
      if (
        (declaration.type === "ClassDeclaration" || declaration.type === "FunctionDeclaration") &&
        declaration.id !== null
      ) {
        names.add(declaration.id.name);
      }
      continue;
    }
    if (statement.type !== "ExportNamedDeclaration") continue;
    const declaration = statement.declaration;
    if (
      (declaration?.type === "ClassDeclaration" || declaration?.type === "FunctionDeclaration") &&
      declaration.id !== null
    ) {
      names.add(declaration.id.name);
    }
    if (declaration?.type === "VariableDeclaration") {
      for (const declarator of declaration.declarations) {
        if (declarator.id.type === "Identifier") names.add(declarator.id.name);
      }
    }
    if (statement.source !== null) continue;
    for (const specifier of statement.specifiers) {
      if (specifier.type === "ExportSpecifier") names.add(exportName(specifier.local));
    }
  }
  return names;
}

function isServiceFactory(
  sourceCode: SourceCode,
  callee: ESTree.CallExpression["callee"],
  context: ModuleBindings,
): boolean {
  return isModuleCall(sourceCode, callee, context, "Service");
}

function isContextService(
  sourceCode: SourceCode,
  superClass: ESTree.Expression | null,
  context: ModuleBindings,
): boolean {
  if (superClass?.type !== "CallExpression") return false;
  if (isServiceFactory(sourceCode, superClass.callee, context)) return true;
  return (
    superClass.callee.type === "CallExpression" &&
    isServiceFactory(sourceCode, superClass.callee.callee, context)
  );
}

type Factory = ESTree.Function | ESTree.ArrowFunctionExpression;

function isFactory(node: ESTree.Node): node is Factory {
  return (
    node.type === "FunctionDeclaration" ||
    node.type === "FunctionExpression" ||
    node.type === "ArrowFunctionExpression"
  );
}

function isModuleDeclaration(node: ESTree.Node): boolean {
  return (
    node.parent?.type === "Program" ||
    node.parent?.type === "ExportNamedDeclaration" ||
    node.parent?.type === "ExportDefaultDeclaration"
  );
}

function makeName(name: string): boolean {
  return name === "make" || /^make[A-Z]/u.test(name);
}

function layerName(name: string): boolean {
  return name === "layer" || name === "defaultLayer" || /^layer[A-Z]/u.test(name);
}

function expectedLayer(make: string): string {
  return make === "make" ? "layer" : "layer" + make.slice(4);
}

function unwrap(node: ESTree.Expression): ESTree.Expression {
  let current = node;
  while (current.type === "ParenthesizedExpression" || current.type === "TSSatisfiesExpression") {
    current = current.expression;
  }
  return current;
}

function moduleIdentifier(sourceCode: SourceCode, node: ESTree.Expression): string | null {
  const current = unwrap(node);
  if (current.type !== "Identifier") return null;
  let scope = sourceCode.getScope(current);
  while (true) {
    if (scope.set.has(current.name)) {
      return scope.block.type === "Program" ? current.name : null;
    }
    if (scope.upper === null) return null;
    scope = scope.upper;
  }
}

function constructorName(sourceCode: SourceCode, node: ESTree.Expression): string | null {
  const current = unwrap(node);
  if (current.type === "CallExpression" && !current.optional) {
    return moduleIdentifier(sourceCode, current.callee);
  }
  return moduleIdentifier(sourceCode, current);
}

function layerPair(
  sourceCode: SourceCode,
  initializer: ESTree.Expression,
  layer: ModuleBindings,
): LayerPair | null {
  let current = unwrap(initializer);
  // Provisioning a returned layer does not change which constructor builds its service.
  while (
    current.type === "CallExpression" &&
    current.callee.type === "MemberExpression" &&
    !current.callee.computed &&
    current.callee.property.type === "Identifier" &&
    current.callee.property.name === "pipe"
  ) {
    current = unwrap(current.callee.object);
  }
  if (current.type !== "CallExpression" || current.optional) return null;

  const call = current.callee.type === "CallExpression" ? current.callee : current;
  const method = layerConstructors.find((name) =>
    isModuleCall(sourceCode, call.callee, layer, name),
  );
  if (method === undefined) return null;
  const serviceArgument = call.arguments[0];
  const makeArgument = current.arguments[call === current ? 1 : 0];
  if (
    serviceArgument === undefined ||
    serviceArgument.type === "SpreadElement" ||
    makeArgument === undefined ||
    makeArgument.type === "SpreadElement"
  )
    return null;

  const service = moduleIdentifier(sourceCode, serviceArgument);
  let construction = unwrap(makeArgument);
  if (
    method === "sync" &&
    construction.type === "ArrowFunctionExpression" &&
    !construction.async &&
    construction.body.type !== "BlockStatement"
  ) {
    construction = construction.body;
  }
  const make = constructorName(sourceCode, construction);
  return service === null || make === null ? null : { service, make };
}

/** Require exported Effect service modules to expose paired make and Layer constructors. */
export const requireServiceMakeLayerRule = defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Require exported Context.Service modules to expose a make constructor and Layer.",
    },
    messages: {
      missingMake:
        "Export a module-level make constructor for {{service}} so implementation construction is reusable and testable.",
      missingLayer:
        "Export layer (or a layerX matching makeX), as a value or factory, built from {{service}} and its exported make constructor.",
    },
  },
  createOnce(context) {
    const contextModule = moduleBindings("effect/Context", "Context");
    const layerModule = moduleBindings("effect/Layer", "Layer");
    const services: ServiceDeclaration[] = [];
    const makes = new Set<string>();
    const layers = new Map<string, Array<LayerPair | null>>();
    const factories = new Map<Factory, Array<LayerPair | null>>();
    let exports = new Set<string>();

    function registerLayer(name: string, node: ESTree.Expression | ESTree.Function) {
      if (!layerName(name)) return;
      if (!isFactory(node)) {
        layers.set(name, [layerPair(context.sourceCode, node, layerModule)]);
        return;
      }
      if (node.async || node.generator || node.body === null) return;
      const pairs: Array<LayerPair | null> = [];
      layers.set(name, pairs);
      factories.set(node, pairs);
      if (node.body.type !== "BlockStatement") {
        pairs.push(layerPair(context.sourceCode, node.body, layerModule));
      }
    }

    return {
      Program(node) {
        services.length = 0;
        makes.clear();
        layers.clear();
        factories.clear();
        exports = exportedNames(node);
      },
      ClassDeclaration(node) {
        if (
          node.id !== null &&
          isModuleDeclaration(node) &&
          exports.has(node.id.name) &&
          isContextService(context.sourceCode, node.superClass, contextModule)
        ) {
          services.push({ name: node.id.name, node });
        }
      },
      FunctionDeclaration(node) {
        if (node.id === null || !isModuleDeclaration(node) || !exports.has(node.id.name)) return;
        if (makeName(node.id.name)) makes.add(node.id.name);
        registerLayer(node.id.name, node);
      },
      VariableDeclarator(node) {
        if (
          !isModuleDeclaration(node.parent) ||
          node.id.type !== "Identifier" ||
          !exports.has(node.id.name)
        )
          return;
        if (makeName(node.id.name)) makes.add(node.id.name);
        if (node.init !== null) registerLayer(node.id.name, unwrap(node.init));
      },
      ReturnStatement(node) {
        let parent = node.parent;
        while (parent !== null && parent.type !== "Program" && !isFactory(parent))
          parent = parent.parent;
        if (parent === null || !isFactory(parent)) return;
        factories
          .get(parent)
          ?.push(
            node.argument === null
              ? null
              : layerPair(context.sourceCode, node.argument, layerModule),
          );
      },
      "Program:exit"() {
        for (const service of services) {
          if (makes.size === 0) {
            context.report({
              node: service.node,
              messageId: "missingMake",
              data: { service: service.name },
            });
            continue;
          }
          const paired = [...layers].some(
            ([name, pairs]) =>
              pairs.length > 0 &&
              pairs.every((pair) => {
                if (pair === null || pair.service !== service.name || !makes.has(pair.make))
                  return false;
                return (
                  name === expectedLayer(pair.make) ||
                  (pair.make === "make" && name === "defaultLayer")
                );
              }),
          );
          if (!paired) {
            context.report({
              node: service.node,
              messageId: "missingLayer",
              data: { service: service.name },
            });
          }
        }
      },
    };
  },
});
