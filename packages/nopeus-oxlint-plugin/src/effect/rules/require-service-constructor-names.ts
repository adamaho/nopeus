import { defineRule, type ESTree, type Variable } from "@oxlint/plugins";

import { isModuleCall, isModuleType, moduleBindings } from "./effect-call.ts";

type Kind = "layer" | "make";
type Factory = ESTree.Function | ESTree.ArrowFunctionExpression;

const layerMethods = [
  "effect",
  "effectContext",
  "effectDiscard",
  "succeed",
  "succeedContext",
  "sync",
  "syncContext",
  "unwrap",
  "suspend",
  "merge",
  "mergeAll",
  "fresh",
  "orDie",
] as const;

const layerCombinators = ["provide", "provideMerge", "catch", "catchCause"] as const;

function isFactory(node: ESTree.Node): node is Factory {
  return (
    node.type === "FunctionDeclaration" ||
    node.type === "FunctionExpression" ||
    node.type === "ArrowFunctionExpression"
  );
}

function unwrap(node: ESTree.Expression): ESTree.Expression {
  let current = node;
  while (
    current.type === "ParenthesizedExpression" ||
    current.type === "TSSatisfiesExpression" ||
    current.type === "TSAsExpression" ||
    current.type === "TSNonNullExpression" ||
    current.type === "TSTypeAssertion"
  ) {
    current = current.expression;
  }
  return current;
}

function exportName(node: ESTree.ModuleExportName): string {
  return node.type === "Identifier" ? node.name : node.value;
}

/** Name public service constructors consistently without requiring paired exports. */
export const requireServiceConstructorNamesRule = defineRule({
  meta: {
    type: "suggestion",
    docs: { description: "Name exported Layers layer/layerX and service constructors make/makeX." },
    messages: {
      layer: "Name this exported Layer or Layer factory layer or layerX (for example layerConfig).",
      make: "Name this exported service constructor make or makeX (for example makeMemory).",
    },
  },
  createOnce(context) {
    const layer = moduleBindings("effect/Layer", "Layer");
    const effect = moduleBindings("effect/Effect", "Effect");
    const service = moduleBindings("effect/Context", "Context");
    const services = new Set<Variable>();
    const interfaces = new Set<Variable>();
    const constructors = new Set<Variable>();
    const returns = new Map<Factory, ESTree.Expression[]>();
    const exports: Array<{ name: string; node: ESTree.Node; value: ESTree.Node }> = [];

    function variable(node: ESTree.Identifier): Variable | undefined {
      let scope = context.sourceCode.getScope(node);
      while (true) {
        const found = scope.set.get(node.name);
        if (found !== undefined) return found;
        if (scope.upper === null) return undefined;
        scope = scope.upper;
      }
    }

    function hasBinding(bindings: ReadonlySet<Variable>, node: ESTree.Identifier): boolean {
      const binding = variable(node);
      return binding !== undefined && bindings.has(binding);
    }

    function serviceCall(expression: ESTree.Expression | null): ESTree.CallExpression | null {
      if (expression === null) return null;
      const node = unwrap(expression);
      if (node.type !== "CallExpression") return null;
      const call = node.callee.type === "CallExpression" ? node.callee : node;
      return isModuleCall(context.sourceCode, call.callee, service, "Service") ? call : null;
    }

    function registerService(id: ESTree.BindingIdentifier, call: ESTree.CallExpression) {
      const binding = variable(id);
      if (binding !== undefined) services.add(binding);
      if (id.parent.type === "ClassDeclaration") {
        for (const declared of context.sourceCode.getDeclaredVariables(id.parent))
          services.add(declared);
      }
      const shape = call.typeArguments?.params.at(-1);
      if (shape?.type === "TSTypeReference" && shape.typeName.type === "Identifier") {
        const shapeBinding = variable(shape.typeName);
        if (shapeBinding !== undefined) interfaces.add(shapeBinding);
      }
    }

    function typeKind(type: ESTree.TSType | undefined): Kind | null {
      if (type?.type !== "TSTypeReference") return null;
      if (isModuleType(context.sourceCode, type.typeName, layer, "Layer")) return "layer";
      if (isModuleType(context.sourceCode, type.typeName, effect, "Effect")) {
        return typeKind(type.typeArguments?.params[0]);
      }
      return type.typeName.type === "Identifier" && hasBinding(interfaces, type.typeName)
        ? "make"
        : null;
    }

    function kind(node: ESTree.Node, seen = new Set<ESTree.Node>()): Kind | null {
      if (seen.has(node)) return null;
      const visited = new Set(seen).add(node);
      if (node.type === "VariableDeclarator") {
        return (
          (node.id.type === "Identifier"
            ? (typeKind(node.id.typeAnnotation?.typeAnnotation) ??
              (hasBinding(constructors, node.id) ? "make" : null))
            : null) ?? (node.init === null ? null : kind(node.init, visited))
        );
      }
      if (isFactory(node)) {
        return (
          typeKind(node.returnType?.typeAnnotation) ??
          (node.type !== "ArrowFunctionExpression" &&
          node.id !== null &&
          hasBinding(constructors, node.id)
            ? "make"
            : null) ??
          (node.body !== null && node.body.type !== "BlockStatement"
            ? kind(node.body, visited)
            : ((returns.get(node) ?? [])
                .map((value) => kind(value, visited))
                .find((value) => value !== null) ?? null))
        );
      }
      if (node.type === "Identifier") {
        if (isModuleCall(context.sourceCode, node, layer, "empty")) return "layer";
        const binding = variable(node);
        if (binding === undefined || services.has(binding)) return null;
        if (constructors.has(binding)) return "make";
        for (const definition of binding.defs) {
          if (definition.type !== "ImportBinding") {
            const result = kind(definition.node, visited);
            if (result !== null) return result;
          }
        }
        return null;
      }
      if (
        node.type === "ParenthesizedExpression" ||
        node.type === "TSSatisfiesExpression" ||
        node.type === "TSAsExpression" ||
        node.type === "TSTypeAssertion" ||
        node.type === "TSNonNullExpression"
      ) {
        return kind(node.expression, visited);
      }
      if (node.type === "AwaitExpression") return kind(node.argument, visited);
      if (node.type === "YieldExpression")
        return node.argument === null ? null : kind(node.argument, visited);
      if (node.type === "ConditionalExpression")
        return kind(node.consequent, visited) ?? kind(node.alternate, visited);
      if (
        node.type === "MemberExpression" &&
        isModuleCall(context.sourceCode, node, layer, "empty")
      )
        return "layer";
      if (node.type !== "CallExpression") return null;
      const call = node.callee.type === "CallExpression" ? node.callee : node;
      if (layerMethods.some((name) => isModuleCall(context.sourceCode, call.callee, layer, name)))
        return "layer";
      if (
        (call !== node || node.arguments.length >= 2) &&
        layerCombinators.some((name) => isModuleCall(context.sourceCode, call.callee, layer, name))
      )
        return "layer";
      if (
        node.callee.type === "MemberExpression" &&
        !node.callee.computed &&
        node.callee.property.type === "Identifier"
      ) {
        const receiver = node.callee.object;
        if (
          node.callee.property.name === "of" &&
          receiver.type === "Identifier" &&
          hasBinding(services, receiver)
        )
          return "make";
        if (node.callee.property.name === "pipe" && receiver.type !== "Super") {
          const last = node.arguments.at(-1);
          if (
            last?.type === "CallExpression" &&
            ["map", "flatMap", "as", "asVoid"].some((name) =>
              isModuleCall(context.sourceCode, last.callee, effect, name),
            )
          )
            return kind(last, visited);
          return kind(receiver, visited);
        }
      }
      if (
        ["gen", "fn", "fnUntraced", "sync", "succeed", "map", "flatMap", "suspend"].some((name) =>
          isModuleCall(context.sourceCode, call.callee, effect, name),
        )
      ) {
        const args = node.arguments.filter((arg) => arg.type !== "SpreadElement");
        const result = args.at(-1);
        return result === undefined ? null : kind(result, visited);
      }
      return node.callee.type === "Identifier" ? kind(node.callee, visited) : null;
    }

    function registerConstructor(expression: ESTree.Expression) {
      const node = unwrap(expression);
      if (node.type === "Identifier") {
        const binding = variable(node);
        if (binding !== undefined && binding.defs.some((def) => def.type !== "ImportBinding"))
          constructors.add(binding);
      } else if (node.type === "CallExpression" && node.callee.type === "Identifier") {
        registerConstructor(node.callee);
      } else if (isFactory(node)) {
        if (node.body !== null && node.body.type !== "BlockStatement")
          registerConstructor(node.body);
        else for (const value of returns.get(node) ?? []) registerConstructor(value);
      }
    }

    return {
      Program() {
        services.clear();
        interfaces.clear();
        constructors.clear();
        returns.clear();
        exports.length = 0;
      },
      ClassDeclaration(node) {
        const call = serviceCall(node.superClass);
        if (node.id !== null && call !== null) registerService(node.id, call);
      },
      VariableDeclarator(node) {
        const call = serviceCall(node.init);
        if (node.id.type === "Identifier" && call !== null) registerService(node.id, call);
      },
      ReturnStatement(node) {
        if (node.argument === null) return;
        let parent: ESTree.Node | null = node.parent;
        while (parent !== null && !isFactory(parent)) parent = parent.parent;
        if (parent === null) return;
        const values = returns.get(parent) ?? [];
        values.push(node.argument);
        returns.set(parent, values);
      },
      "CallExpression:exit"(node) {
        const call = node.callee.type === "CallExpression" ? node.callee : node;
        if (
          !["effect", "succeed", "sync"].some((name) =>
            isModuleCall(context.sourceCode, call.callee, layer, name),
          )
        )
          return;
        const construction = node.arguments[call === node ? 1 : 0];
        if (construction !== undefined && construction.type !== "SpreadElement")
          registerConstructor(construction);
      },
      ExportNamedDeclaration(node) {
        if (node.exportKind === "type" || node.source !== null) return;
        const declaration = node.declaration;
        if (declaration?.type === "VariableDeclaration") {
          for (const item of declaration.declarations) {
            if (item.id.type === "Identifier")
              exports.push({ name: item.id.name, node: item.id, value: item });
          }
        } else if (declaration?.type === "FunctionDeclaration" && declaration.id !== null) {
          exports.push({ name: declaration.id.name, node: declaration.id, value: declaration });
        }
        for (const specifier of node.specifiers) {
          if (specifier.type === "ExportSpecifier" && specifier.exportKind !== "type") {
            exports.push({
              name: exportName(specifier.exported),
              node: specifier.exported,
              value: specifier.local,
            });
          }
        }
      },
      ExportDefaultDeclaration(node) {
        exports.push({ name: "default", node, value: node.declaration });
      },
      "Program:exit"() {
        for (const entry of exports) {
          const result = kind(entry.value);
          if (result === null) continue;
          const pattern =
            result === "layer" ? /^layer(?:[A-Z][a-zA-Z0-9]*)?$/u : /^make(?:[A-Z][a-zA-Z0-9]*)?$/u;
          if (!pattern.test(entry.name)) context.report({ node: entry.node, messageId: result });
        }
      },
    };
  },
});
