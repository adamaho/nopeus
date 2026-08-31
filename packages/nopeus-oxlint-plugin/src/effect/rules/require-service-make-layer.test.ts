import { RuleTester } from "oxlint/plugins-dev";

import { requireServiceMakeLayerRule } from "./require-service-make-layer.ts";

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } });

tester.run("nopeus/require-service-make-layer", requireServiceMakeLayerRule, {
  valid: [
    `import { Context, Effect, Layer } from "effect";
     export class Users extends Context.Service<Users, {}>()("@app/Users") {}
     export const make = Effect.gen(function* () { return Users.of({}); });
     export const layer = Layer.effect(Users, make);`,
    `import * as Context from "effect/Context";
     import * as Layer from "effect/Layer";
     export class Storage extends Context.Service<Storage, {}>()("@app/Storage") {}
     export function makeMemory() { return Storage.of({}); }
     export const layerMemory = Layer.sync(Storage)(makeMemory);`,
    'const Context = { Service: () => () => class {} }; export class Users extends Context.Service()("Users") {}',
  ],
  invalid: [
    {
      code: `import { Context } from "effect";
             export class Users extends Context.Service<Users, {}>()("@app/Users") {}`,
      errors: [{ messageId: "missingMake" }],
    },
    {
      code: `import { Context, Effect } from "effect";
             export class Users extends Context.Service<Users, {}>()("@app/Users") {}
             export const make = Effect.succeed(Users.of({}));`,
      errors: [{ messageId: "missingLayer" }],
    },
    {
      code: `import { Context, Effect, Layer } from "effect";
             export class Users extends Context.Service<Users, {}>()("@app/Users") {}
             export const makeMemory = Effect.succeed(Users.of({}));
             export const layer = Layer.effect(Users, makeMemory);`,
      errors: [{ messageId: "missingLayer" }],
    },
  ],
});
