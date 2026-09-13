import { RuleTester } from "oxlint/plugins-dev";

import { noUnscopedForkRule } from "#src/effect/rules/no-unscoped-fork.ts";

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } });

tester.run("nopeus/no-unscoped-fork", noUnscopedForkRule, {
  valid: [
    'import { Effect } from "effect"; Effect.forkScoped(worker); Effect.forkIn(worker, scope);',
    "const Effect = { forkDetach() {} }; Effect.forkDetach(worker);",
  ],
  invalid: [
    {
      code: 'import { Effect } from "effect"; Effect.forkDetach(worker);',
      errors: [{ messageId: "scopedFork" }],
    },
  ],
});
