import {
  defineRule,
  type ESTree,
  type Scope,
  type SourceCode,
  type Variable,
} from "@oxlint/plugins";

interface Replacement {
  readonly effect: string;
  readonly provider: string;
}

const moduleReplacements = new Map<string, Replacement>([
  [
    "fs",
    {
      effect: "FileSystem.FileSystem",
      provider: "NodeFileSystem.layer (or NodeServices.layer)",
    },
  ],
  [
    "fs/promises",
    {
      effect: "FileSystem.FileSystem",
      provider: "NodeFileSystem.layer (or NodeServices.layer)",
    },
  ],
  ["path", { effect: "Path.Path", provider: "NodePath.layer (or NodeServices.layer)" }],
  [
    "child_process",
    {
      effect: "ChildProcess commands and ChildProcessSpawner.ChildProcessSpawner",
      provider: "NodeChildProcessSpawner.layer (or NodeServices.layer)",
    },
  ],
]);

const cryptoReplacements = new Map<string, Replacement>([
  [
    "randomUUID",
    { effect: "Crypto.Crypto.randomUUIDv4", provider: "NodeCrypto.layer (or NodeServices.layer)" },
  ],
  [
    "randomUUIDv7",
    { effect: "Crypto.Crypto.randomUUIDv7", provider: "NodeCrypto.layer (or NodeServices.layer)" },
  ],
  [
    "randomBytes",
    { effect: "Crypto.Crypto.randomBytes", provider: "NodeCrypto.layer (or NodeServices.layer)" },
  ],
  [
    "randomInt",
    {
      effect: "Crypto.Crypto.randomIntBetween",
      provider: "NodeCrypto.layer (or NodeServices.layer)",
    },
  ],
  [
    "createHash",
    { effect: "Crypto.Crypto.digest", provider: "NodeCrypto.layer (or NodeServices.layer)" },
  ],
  [
    "hash",
    { effect: "Crypto.Crypto.digest", provider: "NodeCrypto.layer (or NodeServices.layer)" },
  ],
  [
    "subtle.digest",
    { effect: "Crypto.Crypto.digest", provider: "NodeCrypto.layer (or NodeServices.layer)" },
  ],
  [
    "webcrypto.subtle.digest",
    { effect: "Crypto.Crypto.digest", provider: "NodeCrypto.layer (or NodeServices.layer)" },
  ],
]);

const urlReplacements = new Map<string, Replacement>([
  [
    "fileURLToPath",
    { effect: "Path.Path.fromFileUrl", provider: "NodePath.layer (or NodeServices.layer)" },
  ],
  [
    "pathToFileURL",
    { effect: "Path.Path.toFileUrl", provider: "NodePath.layer (or NodeServices.layer)" },
  ],
]);

const consoleMethods = [
  "assert",
  "clear",
  "count",
  "countReset",
  "debug",
  "dir",
  "dirxml",
  "error",
  "group",
  "groupCollapsed",
  "groupEnd",
  "info",
  "log",
  "table",
  "time",
  "timeEnd",
  "timeLog",
  "trace",
  "warn",
] as const;
const consoleReplacements = new Map<string, Replacement>(
  consoleMethods.map((method) => [
    method,
    {
      effect: `Console.Console.${method}`,
      provider: "the runtime-provided Console.Console service",
    },
  ]),
);

const processReplacements = new Map<string, Replacement>([
  ["argv", { effect: "Stdio.Stdio.args", provider: "NodeStdio.layer (or NodeServices.layer)" }],
  ["stdin", { effect: "Stdio.Stdio.stdin", provider: "NodeStdio.layer (or NodeServices.layer)" }],
  ["stdout", { effect: "Stdio.Stdio.stdout", provider: "NodeStdio.layer (or NodeServices.layer)" }],
  ["stderr", { effect: "Stdio.Stdio.stderr", provider: "NodeStdio.layer (or NodeServices.layer)" }],
  [
    "hrtime",
    {
      effect: "Clock.Clock.monotonicTimeNanos",
      provider: "the runtime-provided Clock.Clock service",
    },
  ],
]);

const timerReplacements = new Map<string, Replacement>([
  ["setTimeout", { effect: "Effect.sleep", provider: "the runtime-provided Clock.Clock service" }],
  [
    "setInterval",
    {
      effect: "Effect.repeat or Stream.fromEffectSchedule",
      provider: "the runtime-provided Clock.Clock service",
    },
  ],
]);

const httpReplacements = new Map<string, Replacement>([
  [
    "get",
    {
      effect: "HttpClient.get through HttpClient.HttpClient",
      provider: "NodeHttpClient.layerUndici or NodeHttpClient.layerNodeHttp",
    },
  ],
  [
    "request",
    {
      effect: "HttpClient.execute through HttpClient.HttpClient",
      provider: "NodeHttpClient.layerUndici or NodeHttpClient.layerNodeHttp",
    },
  ],
  [
    "createServer",
    {
      effect: "HttpServer.HttpServer for server behavior",
      provider: "NodeHttpServer.layer or NodeHttpServer.layerConfig",
    },
  ],
]);

const netReplacements = new Map<string, Replacement>([
  ["connect", { effect: "Socket.Socket", provider: "NodeSocket.makeNet or NodeSocket.layerNet" }],
  [
    "createConnection",
    { effect: "Socket.Socket", provider: "NodeSocket.makeNet or NodeSocket.layerNet" },
  ],
  ["createServer", { effect: "SocketServer.SocketServer", provider: "NodeSocketServer.layer" }],
]);

const performanceReplacements = new Map<string, Replacement>([
  [
    "performance.now",
    {
      effect: "Clock.Clock.monotonicTimeNanos",
      provider: "the runtime-provided Clock.Clock service",
    },
  ],
]);

const symbolReplacements = new Map<string, ReadonlyMap<string, Replacement>>([
  ["console", consoleReplacements],
  ["crypto", cryptoReplacements],
  ["http", httpReplacements],
  ["https", httpReplacements],
  ["net", netReplacements],
  ["perf_hooks", performanceReplacements],
  ["process", processReplacements],
  ["timers", timerReplacements],
  ["timers/promises", timerReplacements],
  ["url", urlReplacements],
]);

function builtinName(source: string): string {
  return source.startsWith("node:") ? source.slice(5) : source;
}

function importedName(specifier: ESTree.ImportSpecifier): string {
  return specifier.imported.type === "Identifier"
    ? specifier.imported.name
    : specifier.imported.value;
}

function isValueSpecifier(
  declaration: ESTree.ImportDeclaration,
  specifier: ESTree.ImportDeclaration["specifiers"][number],
): boolean {
  return (
    declaration.importKind !== "type" &&
    (specifier.type !== "ImportSpecifier" || specifier.importKind !== "type")
  );
}

function hasValueImport(node: ESTree.ImportDeclaration): boolean {
  return (
    node.importKind !== "type" &&
    (node.specifiers.length === 0 ||
      node.specifiers.some((specifier) => isValueSpecifier(node, specifier)))
  );
}

function resolveVariable(sourceCode: SourceCode, identifier: ESTree.Node): Variable | null {
  if (identifier.type !== "Identifier") return null;
  let scope: Scope | null = sourceCode.getScope(identifier);
  while (scope !== null) {
    const variable = scope.set.get(identifier.name);
    if (variable !== undefined) return variable;
    scope = scope.upper;
  }
  return null;
}

interface ImportBinding {
  readonly imported: string | null;
  readonly source: string;
}

function importBinding(sourceCode: SourceCode, identifier: ESTree.Node): ImportBinding | null {
  const variable = resolveVariable(sourceCode, identifier);
  for (const definition of variable?.defs ?? []) {
    if (definition.type !== "ImportBinding" || definition.parent?.type !== "ImportDeclaration")
      continue;
    const specifier = definition.node;
    if (
      specifier.type !== "ImportSpecifier" &&
      specifier.type !== "ImportDefaultSpecifier" &&
      specifier.type !== "ImportNamespaceSpecifier"
    )
      continue;
    if (definition.parent.importKind === "type" || !isValueSpecifier(definition.parent, specifier))
      continue;
    if (specifier.type === "ImportNamespaceSpecifier") {
      return { imported: null, source: definition.parent.source.value };
    }
    if (specifier.type === "ImportDefaultSpecifier") {
      return { imported: "default", source: definition.parent.source.value };
    }
    return { imported: importedName(specifier), source: definition.parent.source.value };
  }
  return null;
}

function propertyName(node: ESTree.MemberExpression): string | null {
  if (!node.computed && node.property.type === "Identifier") return node.property.name;
  return node.property.type === "Literal" && typeof node.property.value === "string"
    ? node.property.value
    : null;
}

interface ImportedMember {
  readonly source: string;
  readonly symbol: string;
}

function importedMember(
  sourceCode: SourceCode,
  node: ESTree.MemberExpression,
): ImportedMember | null {
  const path: string[] = [];
  let current: ESTree.Expression = node;
  while (current.type === "MemberExpression") {
    const name = propertyName(current);
    if (name === null) return null;
    path.unshift(name);
    current = current.object;
  }
  if (current.type !== "Identifier") return null;
  const binding = importBinding(sourceCode, current);
  if (binding === null) return null;
  if (binding.imported !== null && binding.imported !== "default") {
    path.unshift(binding.imported);
  }
  return { source: binding.source, symbol: path.join(".") };
}

function isNodeHttpServerLayerCall(sourceCode: SourceCode, node: ESTree.CallExpression): boolean {
  const callee = node.callee;
  if (callee.type === "Identifier") {
    const binding = importBinding(sourceCode, callee);
    return (
      binding !== null &&
      binding.source === "@effect/platform-node/NodeHttpServer" &&
      (binding.imported === "layer" || binding.imported === "layerConfig")
    );
  }
  if (callee.type !== "MemberExpression" || callee.object.type !== "Identifier") return false;
  const name = propertyName(callee);
  if (name !== "layer" && name !== "layerConfig") return false;
  const binding = importBinding(sourceCode, callee.object);
  return (
    binding !== null &&
    ((binding.source === "@effect/platform-node" && binding.imported === "NodeHttpServer") ||
      (binding.source === "@effect/platform-node/NodeHttpServer" &&
        (binding.imported === null || binding.imported === "default")))
  );
}

function isNodeHttpServerAdapterArgument(sourceCode: SourceCode, node: ESTree.Node): boolean {
  let current = node;
  while (current.parent !== null && current.parent.type !== "Program") {
    const parent = current.parent;
    if (
      parent.type === "CallExpression" &&
      parent.arguments[0] === current &&
      isNodeHttpServerLayerCall(sourceCode, parent)
    )
      return true;
    current = parent;
  }
  return false;
}

function isHttpCreateServer(source: string, symbol: string): boolean {
  const module = builtinName(source);
  return (module === "http" || module === "https") && symbol === "createServer";
}

/** Keep platform I/O replaceable through Effect services. */
export const preferEffectPlatformServicesRule = defineRule({
  meta: {
    type: "problem",
    docs: { description: "Prefer Effect platform services over direct Node platform APIs." },
    messages: {
      platformService:
        "Use {{effect}} (provided by {{provider}}) instead of {{api}} so platform behavior remains typed and replaceable.",
    },
  },
  createOnce(context) {
    const report = (
      node: ESTree.Node,
      source: string,
      symbol: string | null,
      replacement: Replacement,
    ) => {
      const api = symbol === null ? `the ${source} module` : `${source}.${symbol}`;
      context.report({
        node,
        messageId: "platformService",
        data: { api, effect: replacement.effect, provider: replacement.provider },
      });
    };

    return {
      ImportDeclaration(node) {
        const module = builtinName(node.source.value);
        const moduleReplacement = moduleReplacements.get(module);
        if (moduleReplacement !== undefined && hasValueImport(node)) {
          report(node.source, node.source.value, null, moduleReplacement);
          return;
        }

        const replacements = symbolReplacements.get(module);
        if (replacements === undefined || node.importKind === "type") return;
        for (const specifier of node.specifiers) {
          if (specifier.type !== "ImportSpecifier" || !isValueSpecifier(node, specifier)) continue;
          const symbol = importedName(specifier);
          const replacement = replacements.get(symbol);
          if (
            replacement === undefined ||
            symbol === "default" ||
            isHttpCreateServer(node.source.value, symbol)
          )
            continue;
          report(specifier, node.source.value, symbol, replacement);
        }
      },
      MemberExpression(node) {
        const member = importedMember(context.sourceCode, node);
        if (member === null) return;
        const replacement = symbolReplacements.get(builtinName(member.source))?.get(member.symbol);
        if (
          replacement === undefined ||
          (isHttpCreateServer(member.source, member.symbol) &&
            isNodeHttpServerAdapterArgument(context.sourceCode, node))
        )
          return;
        report(node, member.source, member.symbol, replacement);
      },
      Identifier(node) {
        if (
          node.parent.type === "ImportSpecifier" ||
          node.parent.type === "ImportDefaultSpecifier" ||
          node.parent.type === "ImportNamespaceSpecifier"
        )
          return;
        const binding = importBinding(context.sourceCode, node);
        if (
          binding === null ||
          binding.imported === null ||
          !isHttpCreateServer(binding.source, binding.imported) ||
          isNodeHttpServerAdapterArgument(context.sourceCode, node)
        )
          return;
        const replacement = symbolReplacements
          .get(builtinName(binding.source))
          ?.get(binding.imported);
        if (replacement !== undefined) report(node, binding.source, binding.imported, replacement);
      },
    };
  },
});
