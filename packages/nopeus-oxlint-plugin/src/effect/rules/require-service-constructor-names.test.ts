import { RuleTester } from "oxlint/plugins-dev";

import { requireServiceConstructorNamesRule } from "./require-service-constructor-names.ts";

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } });
const imports = 'import { Context, Effect, Layer, Config } from "effect";';
const service = `${imports}
  interface Interface { readonly value: string }
  export class Service extends Context.Service<Service, Interface>()("@app/Service") {}`;

tester.run("nopeus/require-service-constructor-names", requireServiceConstructorNamesRule, {
  valid: [
    `${imports} export const provideDependencies = Layer.provide(deps);`,
    `${service} const make = Effect.succeed(Service.of({ value: "" })); export const read = make.pipe(Effect.map(service => service.value));`,
    `${imports} export function create(Layer: Other) { return Layer.empty; }`,
    `${service} export const unrelated = () => ({ value: "" }); export const layer = (unrelated: Factory) => Layer.sync(Service, unrelated);`,
    service,
    `${service} export const make = (value: string) => Service.of({ value });`,
    `${service} export const makeMemory = Effect.gen(function* () { return Service.of({ value: "" }); });`,
    `${service} export function make(value: string): Interface { return { value }; }`,
    `${service} export const layer = Layer.succeed(Service, { value: "" });`,
    `${service} export const layer = () => Layer.effect(Service, Effect.gen(function* () { return Service.of({ value: "" }); }));`,
    `${service} const build = (value: string) => Service.of({ value }); export const layer = (value: string) => Layer.sync(Service, () => build(value));`,
    `${service} export const make = (value: string) => Effect.succeed(Service.of({ value }));
     export const layerConfig = (options: Config.Wrap<Options>) => Layer.effect(Service, Config.unwrap(options).pipe(Effect.flatMap(make)));`,
    `${imports} export const layer = (options: Options) => Layer.merge(Auth.layer(options.auth), Db.layer(options.db));`,
    `${imports} export function layerConfig(options: Options) { const configured = Layer.merge(a, b); return configured.pipe(Layer.provide(deps)); }`,
    `${imports} const internal = () => Layer.succeed(Service, {}); export { internal as layerMemory };`,
    `${service} const create = () => Service.of({ value: "" }); export { create as make };`,
    `${service} export const make = () => Service.of({ value: "" }); export const layerMemory = () => Layer.succeed(Service, make());`,
    `${imports} export const query = Effect.gen(function* () { return "hello"; });`,
    `${imports} export function query() { const helper = () => Layer.succeed(Service, {}); return "hello"; }`,
    `${imports} export const query = Effect.gen(function* () { const client = Service.of({}); return client.value; });`,
    `${imports} export function create(Layer: Other) { return Layer.succeed(Service, {}); }`,
    `${service} export function create(Service: Other) { return Service.of({}); }`,
    `const Layer = { succeed: () => ({}) }; export const create = () => Layer.succeed();`,
    `${imports} export const build = () => Layer.build(existing);`,
    `${imports} export type { Layer };`,
    `export { layer as authLayer } from "./auth";`,
    `${imports} export const circular = () => circular();`,
    `${service} const create = () => Service.of({ value: "" }); export { Service };`,
  ],
  invalid: [
    { code: `${imports} export const emptyLayer = Layer.empty;`, errors: [{ messageId: "layer" }] },
    {
      code: `${imports} export const configured = Layer.provide(deps)(existing);`,
      errors: [{ messageId: "layer" }],
    },
    {
      code: `${service} export const create = Config.string("VALUE").pipe(Effect.map(value => Service.of({ value })));`,
      errors: [{ messageId: "make" }],
    },
    {
      code: `${service} export const create = Effect.flatMap(config, value => Effect.succeed(Service.of({ value })));`,
      errors: [{ messageId: "make" }],
    },
    ...[
      "authLayer",
      "defaultLayer",
      "Layer",
      "layerconfig",
      "layer_config",
      "layerConfig_extra",
    ].map((name) => ({
      code: `${imports} export const ${name} = (options: Options) => Layer.succeed(Service, options);`,
      errors: [{ messageId: "layer" }],
    })),
    ...["create", "Make", "makeclient", "make_client"].map((name) => ({
      code: `${service} export const ${name} = (value: string) => Service.of({ value });`,
      errors: [{ messageId: "make" }],
    })),
    {
      code: `${service} export function create(value: string): Interface { return { value }; }`,
      errors: [{ messageId: "make" }],
    },
    {
      code: `${service} export const create = (value: string): Effect.Effect<Interface> => unknownFactory(value);`,
      errors: [{ messageId: "make" }],
    },
    {
      code: `${service} export const create = Effect.gen(function* () { return Service.of({ value: "" }); });`,
      errors: [{ messageId: "make" }],
    },
    {
      code: `${service} export const create = Effect.fn("Service.create")(function* () { return Service.of({ value: "" }); });`,
      errors: [{ messageId: "make" }],
    },
    {
      code: `${service} export function create() { return { value: "" }; } export const layer = () => Layer.succeed(Service, create());`,
      errors: [{ messageId: "make" }],
    },
    {
      code: `${service} export const create = () => ({ value: "" }); export const layer = () => Layer.sync(Service)(create);`,
      errors: [{ messageId: "make" }],
    },
    {
      code: `${service} export const create = () => ({ value: "" }); export const layer = () => Layer.sync(Service, () => { return create(); });`,
      errors: [{ messageId: "make" }],
    },
    {
      code: `${imports} export const create = () => Layer.effect(Service, Effect.succeed({})).pipe(Layer.provide(deps));`,
      errors: [{ messageId: "layer" }],
    },
    {
      code: `${imports} export function create(options: Options) { const result = Layer.merge(a, b); return result; }`,
      errors: [{ messageId: "layer" }],
    },
    {
      code: `${imports} export const create = (): Layer.Layer<Service> => opaqueFactory();`,
      errors: [{ messageId: "layer" }],
    },
    {
      code: `import type { Layer as L } from "effect/Layer"; export const create = (): L<Service> => opaqueFactory();`,
      errors: [{ messageId: "layer" }],
    },
    {
      code: `import { succeed as provide } from "effect/Layer"; export const create = () => provide(Service)({});`,
      errors: [{ messageId: "layer" }],
    },
    {
      code: `import * as L from "effect/Layer"; export const create = function () { return L.unwrap(config); };`,
      errors: [{ messageId: "layer" }],
    },
    {
      code: `${imports} const layer = () => Layer.merge(a, b); export { layer as authLayer };`,
      errors: [{ messageId: "layer" }],
    },
    {
      code: `${service} const make = () => Service.of({ value: "" }); export { make as create };`,
      errors: [{ messageId: "make" }],
    },
    {
      code: `${imports} export default () => Layer.merge(a, b);`,
      errors: [{ messageId: "layer" }],
    },
    {
      code: `${imports} export default function layer() { return Layer.merge(a, b); }`,
      errors: [{ messageId: "layer" }],
    },
    {
      code: `${imports} export function create(flag: boolean) { if (flag) return Layer.merge(a, b); return fallback; }`,
      errors: [{ messageId: "layer" }],
    },
    {
      code: `${service} export const make = () => Effect.succeed(Service.of({ value: "" })); export const authLayer = () => Layer.effect(Service, make());`,
      errors: [{ messageId: "layer" }],
    },
  ],
});
