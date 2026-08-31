import { RuleTester } from "oxlint/plugins-dev";

import { preferEffectCallbackRule } from "./prefer-effect-callback.ts";

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } });

tester.run("nopeus/prefer-effect-callback", preferEffectCallbackRule, {
  valid: ['import { Effect } from "effect"; Effect.callback((resume) => register(resume));'],
  invalid: [
    {
      code: 'import { Effect } from "effect"; Effect.async((resume) => register(resume));',
      errors: [{ messageId: "preferCallback" }],
    },
  ],
});
