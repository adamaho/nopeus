import { RuleTester } from "oxlint/plugins-dev";

import { noExportAssignmentRule } from "#src/rules/no-export-assignment.ts";

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } });

tester.run("nopeus/no-export-assignment", noExportAssignmentRule, {
  valid: ["export const value = 1;", "export default value;", 'export * from "./value.ts";'],
  invalid: [{ code: "const value = 1; export = value;", errors: [{ messageId: "commonjs" }] }],
});
