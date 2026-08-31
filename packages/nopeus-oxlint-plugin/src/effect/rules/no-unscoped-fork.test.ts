import { RuleTester } from "oxlint/plugins-dev";

import { noUnscopedForkRule } from "./no-unscoped-fork.ts";

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } });

tester.run("nopeus/no-unscoped-fork", noUnscopedForkRule, {
  valid: [
    'import { Effect } from "effect"; Effect.forkScoped(worker); Effect.forkIn(worker, scope);',
    "const Effect = { fork() {} }; Effect.fork(worker);",
  ],
  invalid: [
    {
      code: 'import { Effect } from "effect"; Effect.fork(worker); Effect.forkDaemon(worker); Effect.forkDetach(worker);',
      errors: [
        { messageId: "scopedFork" },
        { messageId: "scopedFork" },
        { messageId: "scopedFork" },
      ],
    },
  ],
});
