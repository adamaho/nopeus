import { RuleTester } from "oxlint/plugins-dev";

import { noFallibleEffectPromiseRule } from "./no-fallible-effect-promise.ts";

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } });

tester.run("nopeus/no-fallible-effect-promise", noFallibleEffectPromiseRule, {
  valid: [
    'import { Effect } from "effect"; Effect.tryPromise({ try: () => fetch("/users"), catch: () => new Error() });',
    'import * as Effect from "other"; Effect.promise(() => Promise.resolve(1));',
  ],
  invalid: [
    {
      code: 'import { Effect } from "effect"; Effect.promise(() => fetch("/users"));',
      errors: [{ messageId: "useTryPromise" }],
    },
    {
      code: 'import { promise as lift } from "effect/Effect"; lift(() => fetch("/users"));',
      errors: [{ messageId: "useTryPromise" }],
    },
  ],
});
