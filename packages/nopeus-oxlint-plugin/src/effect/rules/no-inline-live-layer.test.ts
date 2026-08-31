import { RuleTester } from "oxlint/plugins-dev";

import { noInlineLiveLayerRule } from "./no-inline-live-layer.ts";

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } });

tester.run("nopeus/no-inline-live-layer", noInlineLiveLayerRule, {
  valid: [
    'import { Effect, Layer } from "effect"; const live = Layer.effect(Service, make); program.pipe(Effect.provide(live));',
    "const Layer = { effect() {} }; const Effect = { provide() {} }; Effect.provide(Layer.effect(Service, make));",
  ],
  invalid: [
    {
      code: 'import { Effect, Layer } from "effect"; program.pipe(Effect.provide(Layer.effect(Service, make)));',
      errors: [{ messageId: "extractLayer" }],
    },
    {
      code: 'import * as Effect from "effect/Effect"; import * as Layer from "effect/Layer"; Effect.provide(program, Layer.scoped(Service, make));',
      errors: [{ messageId: "extractLayer" }],
    },
  ],
});
