import { RuleTester } from "oxlint/plugins-dev";

import { noEffectRunnersInLibraryRule } from "./no-effect-runners-in-library.ts";

const tester = new RuleTester({
  cwd: "/repo",
  languageOptions: { parserOptions: { lang: "ts" } },
});

tester.run("nopeus/no-effect-runners-in-library", noEffectRunnersInLibraryRule, {
  valid: [
    'import { Effect } from "effect"; export const program = Effect.succeed(1);',
    {
      filename: "/repo/src/main.ts",
      code: 'import { Effect } from "effect"; Effect.runPromise(program);',
      options: [{ allowFiles: ["src/main.ts"] }],
    },
    "const Effect = { runPromise() {} }; Effect.runPromise(program);",
  ],
  invalid: [
    {
      filename: "/repo/src/users.ts",
      code: 'import { Effect } from "effect"; Effect.runPromise(program);',
      options: [{ allowFiles: ["src/main.ts"] }],
      errors: [{ messageId: "libraryRunner" }],
    },
    {
      filename: "/repo/packages/tool/src/main.ts",
      code: 'import { Effect } from "effect"; Effect.runPromise(program);',
      options: [{ allowFiles: ["src/main.ts"] }],
      errors: [{ messageId: "libraryRunner" }],
    },
    {
      code: 'import { runSync as run, runCallbackWith } from "effect/Effect"; run(program); runCallbackWith(context)(program);',
      options: [{ allowFiles: [] }],
      errors: [{ messageId: "libraryRunner" }, { messageId: "libraryRunner" }],
    },
  ],
});
