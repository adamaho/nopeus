import { RuleTester } from "oxlint/plugins-dev";

import { noChainedTypeAssertionsRule } from "./no-chained-type-assertions.ts";

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } });

tester.run("nopeus/no-chained-type-assertions", noChainedTypeAssertionsRule, {
  valid: ["const value = { id: 1 } as const;", "const value = input as User;"],
  invalid: [
    {
      code: "const value = input as unknown as User;",
      errors: [{ messageId: "chained" }],
    },
    {
      code: "const value = (input as unknown) as User;",
      errors: [{ messageId: "chained" }],
    },
  ],
});
