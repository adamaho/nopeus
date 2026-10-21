import { RuleTester } from "oxlint/plugins-dev";
import { afterAll } from "vitest";

import { noReactLayerImportsRule } from "#src/rules/no-react-layer-imports.ts";
import { testWorkspace } from "#test/helpers/workspace.ts";

const workspace = testWorkspace();
afterAll(workspace.cleanup);
workspace.write(
  "packages/app/package.json",
  JSON.stringify({ name: "@fixture/app", type: "module", imports: { "#src/*": "./src/*" } }),
);
workspace.write(
  "packages/app/tsconfig.json",
  JSON.stringify({ compilerOptions: { paths: { "@data/*": ["./src/data/*"] } } }),
);
for (const path of [
  "src/data/receipts.ts",
  "src/features/receipts/data/queries.ts",
  "src/features/receipts/model.ts",
  "src/navigation/link.tsx",
])
  workspace.write("packages/app/" + path, "export const value = 1;\n");

const root = workspace.file("packages/app");
const options = [{ root, clientModules: ["@fixture/client"] }];
const file = (path: string) => workspace.file("packages/app/" + path);
const visual = file("src/features/receipts/receipt-details.tsx");
const route = file("src/routes/receipt.tsx");
const adapter = file("src/navigation/router-link.tsx");
const container = file("src/features/receipts/page.tsx");
const data = file("src/features/receipts/data/receipts.ts");
const tester = new RuleTester({ languageOptions: { parserOptions: { lang: "tsx" } } });
const router = 'import { Link } from "react-router";';
const routers = [
  router,
  'import type { Router } from "@tanstack/react-router";',
  'import { RouterProvider } from "react-router/dom";',
];
const query = 'import { useQuery } from "@tanstack/react-query";';
const dataModules = [
  query,
  'import type { QueryClient } from "@tanstack/react-query";',
  'import useSWR from "swr";',
  'import { client } from "@fixture/client/receipts";',
];
// Aliases resolve to the same data files from every layer.
const dataImport = 'import { value } from "#src/features/receipts/data/queries.ts";';
const aliasData = 'import { value } from "@data/receipts";';
const localData = [
  dataImport,
  aliasData,
  'import type { Value } from "#src/data/receipts.ts";',
  'export { value } from "#src/data/receipts.ts";',
  'export * from "#src/data/receipts.ts";',
  'type Value = import("#src/data/receipts.ts").Value;',
  'const loaded = import("#src/data/receipts.ts");',
  'const loaded = require("#src/data/receipts.ts");',
];
const relativeData = 'import { value } from "./data/queries.ts";';

tester.run("nopeus/no-react-layer-imports", noReactLayerImportsRule, {
  // Import forms are exercised once per outcome; each layer grant uses one import.
  valid: [
    ...[...routers, dataImport].map((code) => ({ code, filename: route, options })),
    { code: router, filename: adapter, options },
    ...[dataImport, aliasData, relativeData].map((code) => ({
      code,
      filename: container,
      options,
    })),
    ...[...dataModules, dataImport].map((code) => ({ code, filename: data, options })),
    ...[
      'import { Link } from "#src/navigation/link.tsx";',
      'import type { Receipt } from "./model.ts";',
      'import { useState } from "react";',
      'import "swrv"; import "react-router-native";',
      "const loaded = import(name);",
      'function load(require: (path: string) => void) { require("./data/queries.ts"); }',
    ].map((code) => ({ code, filename: visual, options })),
    // Tests skip this rule; package and domain rules still check their ownership.
    ...[router, query, dataImport].map((code) => ({
      code,
      filename: file("test/features/receipt-details.test.tsx"),
      options,
    })),
    // Files outside the governed tree or the config root are not classified.
    { code: router, filename: file("vite.config.ts"), options },
    { code: router, filename: workspace.file("packages/a/src/main.ts"), options },
    // Replaced lists take the place of the defaults.
    {
      code: 'import "react-router"; import "swr";',
      filename: file("src/pages/receipt.tsx"),
      options: [{ root, routes: ["src/pages/**"], queryModules: ["@acme/cache"] }],
    },
  ],
  invalid: [
    ...[
      ...routers.map((code) => ({ code, filename: visual })),
      { code: router, filename: container },
      { code: router, filename: data },
    ].map((test) => ({ ...test, options, errors: [{ messageId: "router" }] })),
    ...[
      ...dataModules.map((code) => ({ code, filename: visual })),
      { code: query, filename: container },
      { code: query, filename: route },
      { code: query, filename: adapter },
    ].map((test) => ({ ...test, options, errors: [{ messageId: "dataModule" }] })),
    ...[
      ...[...localData, relativeData].map((code) => ({ code, filename: visual })),
      { code: dataImport, filename: adapter },
    ].map((test) => ({ ...test, options, errors: [{ messageId: "localData" }] })),
    {
      code: router,
      filename: route,
      options: [{ root, routes: ["src/pages/**"] }],
      errors: [{ messageId: "router" }],
    },
  ],
});
