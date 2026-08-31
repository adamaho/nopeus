import { RuleTester } from "oxlint/plugins-dev";

import { noUntypedEffectErrorsRule } from "./no-untyped-effect-errors.ts";

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } });

tester.run("nopeus/no-untyped-effect-errors", noUntypedEffectErrorsRule, {
  valid: [
    'import { Effect } from "effect"; Effect.fail(new UserNotFound({ id }));',
    'import { Effect } from "effect"; Effect.fail(error);',
  ],
  invalid: [
    {
      code: 'import { Effect } from "effect"; Effect.fail("not found");',
      errors: [{ messageId: "domainError" }],
    },
    {
      code: 'import * as Effect from "effect/Effect"; Effect.fail(new Error("not found")); Effect.fail(new TypeError("bad user")); Effect.fail({ message: "bad user" });',
      errors: [
        { messageId: "domainError" },
        { messageId: "domainError" },
        { messageId: "domainError" },
      ],
    },
  ],
});
