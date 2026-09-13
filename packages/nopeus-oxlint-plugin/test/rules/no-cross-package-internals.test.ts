import { RuleTester } from "oxlint/plugins-dev";
import { afterAll } from "vitest";

import { noCrossPackageInternalsRule } from "#src/rules/no-cross-package-internals.ts";
import { testWorkspace } from "#test/helpers/workspace.ts";

const workspace = testWorkspace();
afterAll(workspace.cleanup);
const filename = workspace.file("packages/a/src/main.ts");
const tester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } });
const invalid = [
  'import { value } from "legacy/src/internal.ts";',
  'import { value } from "../../b/src/internal.ts";',
  'import { value } from "../../b/src/index.ts";',
  'import { value } from "@private/internal";',
  'import { value } from "@fixture/b/src/internal.ts";',
  'import { value } from "@fixture/b/feature/private";',
  'export { value } from "../../b/src/internal.ts";',
  'export * from "../../b/src/internal.ts";',
  'import type { Value } from "../../b/src/internal.ts";',
  'type Value = import("../../b/src/internal.ts").Value;',
  'import value = require("../../b/src/internal.ts");',
  'const value = import("../../b/src/internal.ts");',
  'const value = require("../../b/src/internal.ts");',
];

tester.run("nopeus/no-cross-package-internals", noCrossPackageInternalsRule, {
  valid: [
    'import { value } from "legacy";',
    'import { value } from "./local.ts";',
    'import { value } from "@local/local";',
    'import { value } from "@fixture/b";',
    'import { value } from "@fixture/b/session";',
    'import { value } from "@fixture/b/feature/public";',
    'import fs from "node:fs";',
    'import missing from "not-installed";',
    "const value = import(dynamicPath);",
    'function f(require: (path: string) => void) { require("../../b/src/internal.ts"); }',
  ]
    .map((code) => ({ code, filename }))
    .concat([
      {
        code: 'import { value } from "../src/local.ts";',
        filename: workspace.file("packages/a/test/main.test.ts"),
      },
    ]),
  invalid: invalid.map((code) => ({ code, filename, errors: [{ messageId: "boundary" }] })),
});
