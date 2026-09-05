import { RuleTester } from "oxlint/plugins-dev";

import { requireServiceMakeLayerRule } from "./require-service-make-layer.ts";

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } });

tester.run("nopeus/require-service-make-layer", requireServiceMakeLayerRule, {
  valid: [
    `import { Context, Effect, Layer } from "effect";
     export class Service extends Context.Service<Service, {}>()("@app/Auth") {}
     export const make = (options: Options) => Effect.succeed(Service.of({}));
     export const layer = (options: Options) => Layer.effect(Service, make(options));`,
    `import { Context, Effect, Layer } from "effect";
     export class Service extends Context.Service<Service, {}>()("@app/Auth") {}
     export const makeServiceAccount = (options: Options) => Effect.succeed(Service.of({}));
     export function layerServiceAccount(options: Options) {
       return Layer.effect(Service, makeServiceAccount(options));
     }`,
    `import { Context, Effect, Layer } from "effect";
     export class Service extends Context.Service<Service, {}>()("@app/Auth") {}
     export const make = (options: Options) => Effect.succeed(Service.of({}));
     export const layer = (options: Options) => {
       const normalized = normalize(options);
       return Layer.effect(Service, make(normalized));
     };`,
    `import { Context, Layer } from "effect";
     export class Service extends Context.Service<Service, {}>()("@app/Auth") {}
     export const make = (options: Options) => Service.of({});
     export const defaultLayer = function(options: Options) {
       return Layer.succeed(Service)(make(options));
     };`,
    `import { Context, Effect } from "effect";
     import { effect as effectLayer } from "effect/Layer";
     export class Service extends Context.Service<Service, {}>()("@app/Auth") {}
     export const make = (options: Options) => Effect.succeed(Service.of({}));
     export const layer = (options: Options) => effectLayer(Service, make(options));`,
    `import { Context, Effect, Layer } from "effect";
     export class Service extends Context.Service<Service, {}>()("@app/Auth") {}
     export const make = (options: Options) => Effect.succeed(Service.of({}));
     export const layer = (options: Options) => Layer.effect(Service, make(options)).pipe(Layer.provide(dependencies));`,
    `import { Context, Layer } from "effect";
     export class Service extends Context.Service<Service, {}>()("@app/Auth") {}
     export const make = (options: Options) => Service.of({});
     export const layer = (options: Options) => Layer.sync(Service, () => make(options));`,
    `import { Context, Effect, Layer } from "effect";
     export class Service extends Context.Service<Service, {}>()("@app/Auth") {}
     export const make = (options: Options) => Effect.succeed(Service.of({}));
     export function layer(options: Options) {
       if (options.local) return Layer.effect(Service, make(options));
       return Layer.effect(Service, make(defaults));
     }`,
    `import { Context, Effect, Layer } from "effect";
     class Service extends Context.Service<Service, {}>()("@app/Auth") {}
     const make = (options: Options) => Effect.succeed(Service.of({}));
     function layer(options: Options) { return Layer.effect(Service)(make(options)); }
     export { Service, make, layer };`,
    `import { Context, Effect, Layer } from "effect";
     export class Users extends Context.Service<Users, {}>()("@app/Users") {}
     export const make = Effect.gen(function* () { return Users.of({}); });
     export const layer = Layer.effect(Users, make);`,
    `import * as Context from "effect/Context";
     import * as Layer from "effect/Layer";
     export class Storage extends Context.Service<Storage, {}>()("@app/Storage") {}
     export function makeMemory() { return Storage.of({}); }
     export const layerMemory = Layer.sync(Storage)(makeMemory);`,
    `class Users extends Context.Service<Users, {}>()("@app/Users") {}
     const make = Effect.succeed(Users.of({}));
     const layer = Layer.effect(Users, make);
     export { Users, make, layer };
     import { Context, Effect, Layer } from "effect";`,
    `import { Context, Effect, Layer } from "effect";
     export default class Users extends Context.Service<Users, {}>()("@app/Users") {}
     export const make = Effect.succeed(Users.of({}));
     export const layer = Layer.effect(Users, make);`,
    'const Context = { Service: () => () => class {} }; export class Users extends Context.Service()("Users") {}',
  ],
  invalid: [
    {
      code: `import { Context, Effect, Layer } from "effect";
             export class Service extends Context.Service<Service, {}>()("@app/Auth") {}
             export const make = (options: Options) => Effect.succeed(Service.of({}));
             export const layer = (options: Options) => Layer.effect(OtherService, make(options));`,
      errors: [{ messageId: "missingLayer" }],
    },
    {
      code: `import { Context, Effect, Layer } from "effect";
             export class Service extends Context.Service<Service, {}>()("@app/Auth") {}
             export const make = (options: Options) => Effect.succeed(Service.of({}));
             export const layerMemory = (options: Options) => Layer.effect(Service, make(options));`,
      errors: [{ messageId: "missingLayer" }],
    },
    {
      code: `import { Context, Effect, Layer } from "effect";
             export class Service extends Context.Service<Service, {}>()("@app/Auth") {}
             export const make = (options: Options) => Effect.succeed(Service.of({}));
             export const layer = (make: Factory) => Layer.effect(Service, make(options));`,
      errors: [{ messageId: "missingLayer" }],
    },
    {
      code: `import { Context, Effect, Layer } from "effect";
             export class Service extends Context.Service<Service, {}>()("@app/Auth") {}
             export const make = (options: Options) => Effect.succeed(Service.of({}));
             export const layer = (Service: Tag) => Layer.effect(Service, make(options));`,
      errors: [{ messageId: "missingLayer" }],
    },
    {
      code: `import { Context, Effect, Layer } from "effect";
             export class Service extends Context.Service<Service, {}>()("@app/Auth") {}
             export const make = (options: Options) => Effect.succeed(Service.of({}));
             export const layer = (Layer: CustomLayer) => Layer.effect(Service, make(options));`,
      errors: [{ messageId: "missingLayer" }],
    },
    {
      code: `import { Context, Effect, Layer } from "effect";
             export class Service extends Context.Service<Service, {}>()("@app/Auth") {}
             export const make = (options: Options) => Effect.succeed(Service.of({}));
             export function layer(options: Options) { const make = () => other; return Layer.effect(Service, make(options)); }`,
      errors: [{ messageId: "missingLayer" }],
    },
    {
      code: `import { Context, Effect, Layer } from "effect";
             export class Service extends Context.Service<Service, {}>()("@app/Auth") {}
             export const make = (options: Options) => Effect.succeed(Service.of({}));
             export function layer(options: Options) { function nested() { return Layer.effect(Service, make(options)); } return other; }`,
      errors: [{ messageId: "missingLayer" }],
    },
    {
      code: `import { Context, Effect, Layer } from "effect";
             export class Service extends Context.Service<Service, {}>()("@app/Auth") {}
             export const make = (options: Options) => Effect.succeed(Service.of({}));
             export function layer(options: Options) { if (options.local) return other; return Layer.effect(Service, make(options)); }`,
      errors: [{ messageId: "missingLayer" }],
    },
    {
      code: `import { Context, Effect, Layer } from "effect";
             export class Service extends Context.Service<Service, {}>()("@app/Auth") {}
             export const make = (options: Options) => Effect.succeed(Service.of({}));
             export const layer = async (options: Options) => Layer.effect(Service, make(options));`,
      errors: [{ messageId: "missingLayer" }],
    },
    {
      code: `import { Context, Effect, Layer } from "effect";
             export class Service extends Context.Service<Service, {}>()("@app/Auth") {}
             export const make = (options: Options) => Effect.succeed(Service.of({}));
             export function* layer(options: Options) { return Layer.effect(Service, make(options)); }`,
      errors: [{ messageId: "missingLayer" }],
    },
    {
      code: `import { Context, Effect, Layer } from "effect";
             export class Service extends Context.Service<Service, {}>()("@app/Auth") {}
             export const make = (options: Options) => Effect.succeed(Service.of({}));
             export function layer(options: Options) { Layer.effect(Service, make(options)); }`,
      errors: [{ messageId: "missingLayer" }],
    },
    {
      code: `import { Context, Effect, Layer } from "effect";
             export class Service extends Context.Service<Service, {}>()("@app/Auth") {}
             export const make = (options: Options) => Effect.succeed(Service.of({}));
             export const layer = (options: Options) => Layer.effect(Service, unrelated(options));`,
      errors: [{ messageId: "missingLayer" }],
    },
    {
      code: `import { Context, Effect, Layer } from "effect";
             export class Service extends Context.Service<Service, {}>()("@app/Auth") {}
             const make = (options: Options) => Effect.succeed(Service.of({}));
             export const layer = (options: Options) => Layer.effect(Service, make(options));`,
      errors: [{ messageId: "missingMake" }],
    },
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
    {
      code: `import { Context } from "effect";
             class Users extends Context.Service<Users, {}>()("@app/Users") {}
             export { Users };`,
      errors: [{ messageId: "missingMake" }],
    },
    {
      code: `import { Context } from "effect";
             export default class Users extends Context.Service<Users, {}>()("@app/Users") {}`,
      errors: [{ messageId: "missingMake" }],
    },
  ],
});
