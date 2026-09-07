import { RuleTester } from "oxlint/plugins-dev";
import { afterAll } from "vitest";

import { requireTestLocationRule } from "../../src/rules/require-test-location.ts";
import { testWorkspace } from "../helpers/workspace.ts";

const workspace = testWorkspace();
afterAll(workspace.cleanup);
workspace.write("programs/api/package.json", '{"name":"api"}');
const tester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } });

tester.run("nopeus/require-test-location", requireTestLocationRule, {
  valid: [
    "packages/a/src/main.ts",
    "packages/a/test/parser.spec.test.ts",
    "packages/a/test/users/service.test.ts",
    "packages/a/test/integration/server.test.ts",
    "packages/a/test/package/installation.test.ts",
    "packages/a/test/helpers/users.ts",
    "programs/api/test/e2e/server.test.ts",
    "packages/a/test/module.test.mts",
    "packages/a/test/view.test.tsx",
  ].map((path) => ({ code: "const value = 1;", filename: workspace.file(path) })),
  invalid: [
    "packages/a/src/main.test.ts",
    "packages/a/main.test.ts",
    "packages/a/tests/main.test.ts",
    "packages/a/test/main.spec.ts",
    "packages/a/src/main.test.mts",
    "programs/api/src/users/service.test.ts",
    "packages/a/src/test/main.test.ts",
  ].map((path) => ({
    code: "const value = 1;",
    filename: workspace.file(path),
    errors: [{ messageId: "location" }],
  })),
});
