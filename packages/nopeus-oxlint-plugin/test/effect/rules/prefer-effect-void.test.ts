import { RuleTester } from "oxlint/plugins-dev";

import { preferEffectVoidRule } from "#src/effect/rules/prefer-effect-void.ts";

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } });

tester.run("nopeus/prefer-effect-void", preferEffectVoidRule, {
  valid: [
    'import { Effect } from "effect"; const done = Effect.void;',
    'import { Effect } from "effect"; Effect.succeed(null);',
  ],
  invalid: [
    {
      code: 'import { Effect } from "effect"; Effect.succeed(undefined);',
      errors: [{ messageId: "preferVoid" }],
    },
    {
      code: 'import { succeed } from "effect/Effect"; succeed(void 0);',
      errors: [{ messageId: "preferVoid" }],
    },
  ],
});
