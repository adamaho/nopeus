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

function exportedVariable(node: ESTree.VariableDeclarator, exports: ReadonlySet<string>): boolean {
  return node.id.type === "Identifier" && exports.has(node.id.name);
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

function identifierName(
  node: ESTree.CallExpression["arguments"][number] | undefined,
): string | null {
  if (node === undefined || node.type === "SpreadElement") return null;
  let current = node;
  while (current.type === "ParenthesizedExpression" || current.type === "TSSatisfiesExpression") {
    current = current.expression;
  }
  return current.type === "Identifier" ? current.name : null;
}

function layerPair(
  sourceCode: SourceCode,
  initializer: ESTree.Expression,
  layer: ModuleBindings,
): LayerPair | null {
  let current = initializer;
  while (current.type === "ParenthesizedExpression" || current.type === "TSSatisfiesExpression") {
    current = current.expression;
  }
  if (current.type !== "CallExpression") return null;

  if (layerConstructors.some((name) => isModuleCall(sourceCode, current.callee, layer, name))) {
    const service = identifierName(current.arguments[0]);
    const make = identifierName(current.arguments[1]);
    return service === null || make === null ? null : { service, make };
  }

  const inner = current.callee;
  if (inner.type !== "CallExpression") return null;
  if (!layerConstructors.some((name) => isModuleCall(sourceCode, inner.callee, layer, name))) {
    return null;
  }
  const service = identifierName(inner.arguments[0]);
  const make = identifierName(current.arguments[0]);
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
        "Export layer (or a layerX matching makeX) built from {{service}} and its make constructor.",
    },
  },
  createOnce(context) {
    const contextModule = moduleBindings("effect/Context", "Context");
    const layerModule = moduleBindings("effect/Layer", "Layer");
    const services: ServiceDeclaration[] = [];
    const makes = new Set<string>();
    const layers = new Map<string, LayerPair>();
    let exports = new Set<string>();

    return {
      Program(node) {
        exports = exportedNames(node);
      },
      ClassDeclaration(node) {
        if (
          node.id !== null &&
          exports.has(node.id.name) &&
          isContextService(context.sourceCode, node.superClass, contextModule)
        ) {
          services.push({ name: node.id.name, node });
        }
      },
      FunctionDeclaration(node) {
        if (node.id !== null && exports.has(node.id.name) && makeName(node.id.name)) {
          makes.add(node.id.name);
        }
      },
      VariableDeclarator(node) {
        if (!exportedVariable(node, exports) || node.id.type !== "Identifier") return;
        if (makeName(node.id.name)) makes.add(node.id.name);
        if (!layerName(node.id.name) || node.init === null) return;
        const pair = layerPair(context.sourceCode, node.init, layerModule);
        if (pair !== null) layers.set(node.id.name, pair);
      },
      "Program:exit"() {
        for (const service of services) {
          const serviceMakes = [...makes].filter((name) =>
            [...layers.values()].some(
              (pair) => pair.service === service.name && pair.make === name,
            ),
          );
          if (makes.size === 0) {
            context.report({
              node: service.node,
              messageId: "missingMake",
              data: { service: service.name },
            });
            continue;
          }
          const paired = serviceMakes.some((make) => {
            const expected = expectedLayer(make);
            const names = make === "make" ? [expected, "defaultLayer"] : [expected];
            return names.some((name) => {
              const pair = layers.get(name);
              return pair?.service === service.name && pair.make === make;
            });
          });
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
