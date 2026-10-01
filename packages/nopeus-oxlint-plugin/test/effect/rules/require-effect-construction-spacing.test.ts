import { RuleTester } from "oxlint/plugins-dev";

import { requireEffectConstructionSpacingRule } from "#src/effect/rules/require-effect-construction-spacing.ts";

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } });

const imports = 'import { Layer } from "effect";';

tester.run("nopeus/require-effect-construction-spacing", requireEffectConstructionSpacingRule, {
  valid: [
    `${imports}
const RepositoryLive = Repository.layer.pipe(Layer.provide(Database.layer));

const QueueLive = Queue.layer.pipe(Layer.provide(Database.layer));`,
    `${imports}
const RepositoryLive = Layer.succeed(Repository, value);

// Queue composition follows.
const QueueLive = Layer.succeed(Queue, value);`,
    `${imports}
const RepositoryLive = Layer.succeed(Repository, value);
const retryCount = 3;
const QueueLive = Layer.succeed(Queue, value);`,
    `${imports}
function make() { const a = Layer.succeed(A, value); const b = Layer.succeed(B, value); return b; }`,
    `const Layer = { succeed() { return value; } };
const a = Layer.succeed(A, value);
const b = Layer.succeed(B, value);`,
    `import { Schema } from "effect";
const Row = Schema.Struct({ id: Schema.String });
const decodeRow = Schema.decodeUnknownEffect(Row);`,
    `const Row = Schema.Struct({ id: Schema.String });
type Row = typeof Row.Type;
const decodeRow = Schema.decodeUnknownEffect(Row);`,
    `function make() {
      const first = Schema.Struct({ id: Schema.String });
      const second = Schema.Struct({ id: Schema.Number });
      return { first, second };
    }`,
    `function make() {
      const get = () => 1;
      const list = () => 2;
      return Service.of({ get, list });
    }`,
    `function unrelated() {
      const get = Effect.fn("get")(
        function* () { return 1; },
      );
      const list = Effect.fn("list")(
        function* () { return 2; },
      );
      return { get, list };
    }`,
  ],
  invalid: [
    {
      code: `const Row = Schema.Struct({ id: Schema.String });
const decodeRow = Schema.decodeUnknownEffect(Row);
const OtherRow = Schema.Struct({ id: Schema.Number });`,
      output: `const Row = Schema.Struct({ id: Schema.String });
const decodeRow = Schema.decodeUnknownEffect(Row);

const OtherRow = Schema.Struct({ id: Schema.Number });`,
      errors: [{ messageId: "separate" }],
    },
    {
      code: `const Row = Schema.Struct({ id: Schema.String });
type Row = typeof Row.Type;
const OtherRow = Schema.Struct({ id: Schema.Number });`,
      output: `const Row = Schema.Struct({ id: Schema.String });
type Row = typeof Row.Type;

const OtherRow = Schema.Struct({ id: Schema.Number });`,
      errors: [{ messageId: "separate" }],
    },
    {
      code: `const helper = 1;
// A new schema starts here.
const Row = Schema.Struct({ id: Schema.String });`,
      output: null,
      errors: [{ messageId: "separate" }],
    },
    {
      code: `function make() {
  const get = Effect.fn("get")(
    function* () { return 1; },
  );
  const list = Effect.fn("list")(
    function* () { return 2; },
  );
  return Service.of({ get, list });
}`,
      output: `function make() {
  const get = Effect.fn("get")(
    function* () { return 1; },
  );

  const list = Effect.fn("list")(
    function* () { return 2; },
  );

  return Service.of({ get, list });
}`,
      errors: [{ messageId: "separate" }, { messageId: "separate" }],
    },
    {
      code: `${imports}
const RepositoryLive = Repository.layer.pipe(Layer.provide(Database.layer));
const QueueLive = Queue.layer.pipe(Layer.provide(Database.layer));
const ServerLive = HttpRouter.serve(Http.layer.pipe(Layer.provide(RepositoryLive)));`,
      output: `${imports}
const RepositoryLive = Repository.layer.pipe(Layer.provide(Database.layer));

const QueueLive = Queue.layer.pipe(Layer.provide(Database.layer));

const ServerLive = HttpRouter.serve(Http.layer.pipe(Layer.provide(RepositoryLive)));`,
      errors: [{ messageId: "separate" }, { messageId: "separate" }],
    },
    {
      code: `import { Context, Layer, Schema } from "effect";
const Row = Schema.Struct({ id: Schema.String });
const Id = Schema.String.check(Schema.isNonEmpty());
class Repository extends Context.Service<Repository>()("@app/Repository") {}
const RepositoryLive = Layer.succeed(Repository, value);`,
      output: `import { Context, Layer, Schema } from "effect";
const Row = Schema.Struct({ id: Schema.String });

const Id = Schema.String.check(Schema.isNonEmpty());

class Repository extends Context.Service<Repository>()("@app/Repository") {}

const RepositoryLive = Layer.succeed(Repository, value);`,
      errors: [{ messageId: "separate" }, { messageId: "separate" }, { messageId: "separate" }],
    },
    {
      code: `import { succeed } from "effect/Layer";
export const a = succeed(A, value);
export const b = succeed(B, value);`,
      output: `import { succeed } from "effect/Layer";
export const a = succeed(A, value);

export const b = succeed(B, value);`,
      errors: [{ messageId: "separate" }],
    },
  ],
});
