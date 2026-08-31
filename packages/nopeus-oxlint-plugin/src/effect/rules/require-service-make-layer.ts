import { defineRule, type ESTree } from "@oxlint/plugins";

import {
  isModuleCall,
  moduleBindings,
  recordModuleImport,
  type ModuleBindings,
} from "./effect-call.ts";

interface ServiceDeclaration {
  readonly name: string;
  readonly node: ESTree.Class;
}

interface LayerPair {
  readonly service: string;
  readonly make: string;
}

const layerConstructors = ["effect", "succeed", "sync"] as const;

function isExported(node: ESTree.Node): boolean {
  return node.parent?.type === "ExportNamedDeclaration";
}

function isServiceFactory(
  callee: ESTree.CallExpression["callee"],
  context: ModuleBindings,
): boolean {
  return isModuleCall(callee, context, "Service");
}

function isContextService(superClass: ESTree.Expression | null, context: ModuleBindings): boolean {
  if (superClass?.type !== "CallExpression") return false;
  if (isServiceFactory(superClass.callee, context)) return true;
  return (
    superClass.callee.type === "CallExpression" &&
    isServiceFactory(superClass.callee.callee, context)
  );
}

function exportedVariable(node: ESTree.VariableDeclarator): boolean {
  return node.parent.type === "VariableDeclaration" && isExported(node.parent);
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

function layerPair(initializer: ESTree.Expression, layer: ModuleBindings): LayerPair | null {
  let current = initializer;
  while (current.type === "ParenthesizedExpression" || current.type === "TSSatisfiesExpression") {
    current = current.expression;
  }
  if (current.type !== "CallExpression") return null;

  if (layerConstructors.some((name) => isModuleCall(current.callee, layer, name))) {
    const service = identifierName(current.arguments[0]);
    const make = identifierName(current.arguments[1]);
    return service === null || make === null ? null : { service, make };
  }

  const inner = current.callee;
  if (inner.type !== "CallExpression") return null;
  if (!layerConstructors.some((name) => isModuleCall(inner.callee, layer, name))) {
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
    const contextModule = moduleBindings();
    const layerModule = moduleBindings();
    const services: ServiceDeclaration[] = [];
    const makes = new Set<string>();
    const layers = new Map<string, LayerPair>();

    return {
      ImportDeclaration(node) {
        recordModuleImport(node, "effect/Context", "Context", contextModule);
        recordModuleImport(node, "effect/Layer", "Layer", layerModule);
      },
      ClassDeclaration(node) {
        if (
          node.id !== null &&
          isExported(node) &&
          isContextService(node.superClass, contextModule)
        ) {
          services.push({ name: node.id.name, node });
        }
      },
      FunctionDeclaration(node) {
        if (node.id !== null && isExported(node) && makeName(node.id.name)) {
          makes.add(node.id.name);
        }
      },
      VariableDeclarator(node) {
        if (!exportedVariable(node) || node.id.type !== "Identifier") return;
        if (makeName(node.id.name)) makes.add(node.id.name);
        if (!layerName(node.id.name) || node.init === null) return;
        const pair = layerPair(node.init, layerModule);
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
