import { RuleTester } from "oxlint/plugins-dev";
import { afterAll } from "vitest";

import { noTestImportsRule } from "../../src/rules/no-test-imports.ts";
import { testWorkspace } from "../helpers/workspace.ts";

const workspace = testWorkspace();
afterAll(workspace.cleanup);
const filename = workspace.file("packages/a/src/main.ts");
const tester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } });

tester.run("nopeus/no-test-imports", noTestImportsRule, {
  valid: [
    { code: 'import { value } from "./local.ts";', filename },
    {
      code: 'import { value } from "../src/local.ts";',
      filename: workspace.file("packages/a/test/main.test.ts"),
    },
    {
      code: 'import { value } from "./helpers/users.ts";',
      filename: workspace.file("packages/a/test/main.test.ts"),
    },
    {
      code: 'import { value } from "./test/helpers/users.ts";',
      filename: workspace.file("packages/a/vitest.config.ts"),
    },
  ],
  invalid: [
    'import { value } from "../test/helpers/users.ts";',
    'import { value } from "@tests/helpers/users";',
    'import data from "../test/fixtures/users.json";',
    'export * from "../test/helpers/users.ts";',
    'const value = import("../test/helpers/users.ts");',
    'type Value = import("../test/helpers/users.ts").Value;',
    'import type { Value } from "../test/helpers/users.ts";',
    'const value = require("../test/helpers/users.ts");',
    'import value = require("../test/helpers/users.ts");',
    'import value from "./legacy.test.ts";',
    'import value from "../tests/legacy.ts";',
    'import value from "./__tests__/legacy.ts";',
  ].map((code) => ({ code, filename, errors: [{ messageId: "testImport" }] })),
});
