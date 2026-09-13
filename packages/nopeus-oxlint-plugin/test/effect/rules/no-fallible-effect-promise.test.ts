import { RuleTester } from "oxlint/plugins-dev";

import { noFallibleEffectPromiseRule } from "#src/effect/rules/no-fallible-effect-promise.ts";

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } });

tester.run("nopeus/no-fallible-effect-promise", noFallibleEffectPromiseRule, {
  valid: [
    'import { Effect } from "effect"; Effect.tryPromise({ try: () => fetch("/users"), catch: () => new Error() });',
    'import * as Effect from "other"; Effect.promise(() => Promise.resolve(1));',
    'import { Effect } from "effect"; function lift(Effect: { promise: (f: () => unknown) => unknown }) { Effect.promise(() => Promise.resolve(1)); }',
    'import { promise } from "effect/Effect"; function lift(promise: (f: () => unknown) => unknown) { promise(() => Promise.resolve(1)); }',
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
    {
      code: 'Effect.promise(() => fetch("/users")); import { Effect } from "effect";',
      errors: [{ messageId: "useTryPromise" }],
    },
  ],
});
