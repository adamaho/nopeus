import { RuleTester } from "oxlint/plugins-dev";
import { afterAll } from "vitest";

import { noCrossDomainInternalsRule } from "#src/rules/no-cross-domain-internals.ts";
import { testWorkspace } from "#test/helpers/workspace.ts";

const workspace = testWorkspace();
afterAll(workspace.cleanup);
workspace.write(
  "packages/app/package.json",
  JSON.stringify({ name: "@fixture/app", type: "module", imports: { "#src/*": "./src/*" } }),
);
workspace.write(
  "packages/app/tsconfig.json",
  JSON.stringify({ compilerOptions: { paths: { "@receipts/*": ["./src/receipts/*"] } } }),
);
for (const path of [
  "src/receipts/repository.ts",
  "src/receipts/model.ts",
  "src/receipts/sql.ts",
  "src/receipts/exports/service.ts",
  "src/receipts/exports/store.ts",
  "src/uploads/service.ts",
])
  workspace.write("packages/app/" + path, "export const value = 1;\n");

const file = (path: string) => workspace.file("packages/app/" + path);
const options = [
  {
    root: workspace.file("packages/app"),
    domains: [
      { root: "src/receipts", public: ["repository.ts", "model.ts"] },
      { root: "src/receipts/exports", public: ["service.ts"] },
      { root: "src/uploads", public: ["service.ts"] },
    ],
  },
];
const tester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } });
const service = file("src/uploads/worker.ts");
const main = file("src/main.ts");
const internals = [
  'import { value } from "../receipts/sql.ts";',
  'import { value } from "#src/receipts/sql.ts";',
  'import { value } from "@receipts/sql";',
  'import type { Value } from "#src/receipts/sql.ts";',
  'export { value } from "#src/receipts/sql.ts";',
  'export * from "#src/receipts/sql.ts";',
  'type Value = import("#src/receipts/sql.ts").Value;',
  'const loaded = import("#src/receipts/sql.ts");',
  'const loaded = require("#src/receipts/sql.ts");',
];

tester.run("nopeus/no-cross-domain-internals", noCrossDomainInternalsRule, {
  valid: [
    ...[
      // Services may consume several domains' public repositories and models.
      'import { value } from "../receipts/repository.ts"; import type { Value } from "#src/receipts/model.ts";',
      'import { value } from "@receipts/repository"; import { value as uploads } from "./service.ts";',
      'export * from "#src/receipts/exports/service.ts";',
      "const loaded = import(name);",
      'import missing from "@missing/module";',
      'function load(require: (path: string) => void) { require("#src/receipts/sql.ts"); }',
    ].map((code) => ({ code, filename: service, options })),
    // Startup code uses the same public modules.
    {
      code: 'import "#src/receipts/repository.ts"; import "#src/uploads/service.ts";',
      filename: main,
      options,
    },
    // A public module may export its private implementation; no barrel is required.
    {
      code: 'export { value } from "./sql.ts";',
      filename: file("src/receipts/repository.ts"),
      options,
    },
    // Own-package tests may reach internals.
    {
      code: 'import "#src/receipts/sql.ts"; import "#src/receipts/exports/store.ts";',
      filename: file("test/receipts/sql.test.ts"),
      options,
    },
  ],
  invalid: [
    ...[
      ...internals.map((code) => ({ code, filename: service })),
      // Startup code receives no exception.
      { code: 'import "./receipts/sql.ts";', filename: main },
      { code: 'import "#src/receipts/sql.ts";', filename: main },
    ].map((test) => ({ ...test, options, errors: [{ messageId: "internal" }] })),
    // Nested domains use the most specific owner in both directions.
    {
      code: 'import "../sql.ts";',
      filename: file("src/receipts/exports/service.ts"),
      options,
      errors: [
        {
          messageId: "internal",
          data: { domain: "src/receipts", public: "repository.ts, model.ts" },
        },
      ],
    },
    {
      code: 'import "./exports/store.ts";',
      filename: file("src/receipts/repository.ts"),
      options,
      errors: [
        { messageId: "internal", data: { domain: "src/receipts/exports", public: "service.ts" } },
      ],
    },
    // Another package's tests do not receive the own-package allowance.
    {
      code: 'import "../../app/src/receipts/sql.ts";',
      filename: workspace.file("packages/a/test/receipts.test.ts"),
      options,
      errors: [{ messageId: "internal" }],
    },
  ],
});
