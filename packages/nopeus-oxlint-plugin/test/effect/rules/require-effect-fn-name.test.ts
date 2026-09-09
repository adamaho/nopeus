import { RuleTester } from "oxlint/plugins-dev";

import { requireEffectFnNameRule } from "../../../src/effect/rules/require-effect-fn-name.ts";

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } });
const error = { messageId: "missingName" };

tester.run("nopeus/require-effect-fn-name", requireEffectFnNameRule, {
  valid: [
    'import { Effect } from "effect"; const load = Effect.fn("@app/load")(() => 1);',
    'import * as E from "effect"; const load = E.Effect.fn("@app/Users.load" satisfies string)(() => 1);',
    'import { Effect } from "effect"; function run(Effect) { Effect.fn(() => 1); }',

    'import { Effect } from "effect"; const load = Effect.fn("load")(function* () {});',
    'import { Effect as Fx } from "effect"; const load = Fx.fn("App.load")(function* () {});',
    'import * as Effect from "effect/Effect"; const load = Effect.fn("load")(function* () {});',
    'import { fn as effectFn } from "effect/Effect"; const load = effectFn("load")(() => 1);',
    'import { Effect } from "effect"; const service = { load: Effect.fn("Users.load")(() => 1) };',
    'import * as Effect from "effect/Effect"; const load = Effect.fnUntraced(function* () {});',
    "const Effect = { fn() {} }; Effect.fn(function* () {});",
  ],
  invalid: [
    {
      code: 'import * as E from "effect"; const load = E.Effect.fn("@app/save")(() => 1);',
      errors: [{ messageId: "mismatchedName" }],
    },

    {
      code: 'import { Effect } from "effect"; const load = Effect.fn(function* () {});',
      errors: [error],
    },
    {
      code: 'import { Effect as Fx } from "effect"; const name = "load"; Fx.fn(name)(() => 1);',
      errors: [error],
    },
    {
      code: 'import * as Effect from "effect/Effect"; const load = Effect.fn(function* () {});',
      errors: [error],
    },
    {
      code: 'import { fn as effectFn } from "effect/Effect"; effectFn(() => 1);',
      errors: [error],
    },
    {
      code: 'import { Effect } from "effect"; const load = Effect.fn("save")(function* () {});',
      errors: [{ messageId: "mismatchedName" }],
    },
    {
      code: 'import { Effect } from "effect"; const service = { load: Effect.fn("Users.save")(() => 1) };',
      errors: [{ messageId: "mismatchedName" }],
    },
  ],
});
