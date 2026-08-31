import { RuleTester } from "oxlint/plugins-dev";

import { noInlineLiveLayerRule } from "./no-inline-live-layer.ts";

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } });

tester.run("nopeus/no-inline-live-layer", noInlineLiveLayerRule, {
  valid: [
    'import { Effect, Layer } from "effect"; const live = Layer.effect(Service, make); program.pipe(Effect.provide(live));',
    'import { Effect, Layer } from "effect"; program.pipe(Effect.provide(Layer.succeed(Service, testService)));',
    "const Layer = { effect() {} }; const Effect = { provide() {} }; Effect.provide(Layer.effect(Service, make));",
  ],
  invalid: [
    {
      code: 'import { Effect, Layer } from "effect"; program.pipe(Effect.provide(Layer.effect(Service, make)));',
      errors: [{ messageId: "extractLayer" }],
    },
    {
      code: 'import * as Effect from "effect/Effect"; import * as Layer from "effect/Layer"; Effect.provide(program, Layer.unwrap(makeLayer));',
      errors: [{ messageId: "extractLayer" }],
    },
    {
      code: `import { Effect, Layer } from "effect";
             Effect.provide(program, Layer.effectContext(makeContext));
             Effect.provide(program, Layer.syncContext(makeContext));
             Effect.provide(program, Layer.effectDiscard(initialize));
             Effect.provide(program, Layer.merge(Layer.effect(Service, make), Layer.empty));`,
      errors: [
        { messageId: "extractLayer" },
        { messageId: "extractLayer" },
        { messageId: "extractLayer" },
        { messageId: "extractLayer" },
      ],
    },
  ],
});
