import { RuleTester } from "oxlint/plugins-dev";

import { noUntypedEffectErrorsRule } from "../../../src/effect/rules/no-untyped-effect-errors.ts";

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } });

tester.run("nopeus/no-untyped-effect-errors", noUntypedEffectErrorsRule, {
  valid: [
    'import { Effect } from "effect"; Effect.fail(new UserNotFound({ id }));',
    'import { Effect } from "effect"; Effect.fail(error);',
    'import { Effect } from "effect"; class Error { readonly _tag = "DomainError"; } Effect.fail(new Error());',
    'import { Effect } from "effect"; function fail(undefined: DomainError) { return Effect.fail(undefined); }',
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
    {
      code: 'import { Effect } from "effect"; Effect.fail(Error("not found")); Effect.fail(new globalThis.TypeError("bad user"));',
      errors: [{ messageId: "domainError" }, { messageId: "domainError" }],
    },
  ],
});
