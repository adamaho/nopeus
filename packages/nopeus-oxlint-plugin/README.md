# @adamaho/nopeus-oxlint-plugin

Custom Oxlint rules for AI-assisted TypeScript codebases. The `base` preset
enables general TypeScript rules; `effect` adds Effect-specific syntax rules.
Both apply to production and test code.

## Usage

Install Nopeus and its Oxlint peer:

```bash
pnpm add --save-dev @adamaho/nopeus-oxlint-plugin oxlint
```

Neither preset requires `effect`, `@effect/tsgo`, `@effect/language-service`,
`@effect/vitest`, or `oxlint-tsgolint` to be installed. Effect packages listed in
this repository's devDependencies are for developing and testing Nopeus; they
are not installed with the published plugin.

### General TypeScript rules

Use `@adamaho/nopeus-oxlint-plugin/base` in `oxlint.config.ts`:

```ts
import base from "@adamaho/nopeus-oxlint-plugin/base";
import { defineConfig } from "oxlint";

export default defineConfig({ extends: [base] });
```

This enables the general rules for type assertions, type widening, dictionaries,
parameters, reflection, module mocking, conditional spreads, and public JSDoc.
It does not enable Effect service, runtime, state-lifetime, or v4 migration rules.
No compiler patch or Effect-specific tsconfig is needed.

The separate `@adamaho/nopeus-oxlint-config` package selects built-in Oxlint rules.
It does not contain the custom rule implementations in this plugin. To combine
both, install that package too and use `extends: [builtins, base]`, importing
`builtins` from `@adamaho/nopeus-oxlint-config`.

### Effect syntax rules

The `effect` preset includes the general preset, so choose it when the project
uses Effect; there is no need to extend both plugin presets.

Extend the canonical policy from an oxlint.config.ts file:

```ts
import packageJson from "./package.json" with { type: "json" };
import effect from "@adamaho/nopeus-oxlint-plugin/effect";
import { defineConfig } from "oxlint";

export default defineConfig({
  extends: [
    effect({
      packageName: packageJson.name,
      runtimeEntryPoints: ["src/main.ts"],
    }),
  ],
});
```

The root package name defines the owned Effect service namespace. Both goho and
@adamaho/goho require Effect runtime identifiers beginning with @goho/.

The package publishes compiled ESM and requires Node.js 22.18 or newer, or
Node.js 24 or newer.

## Rules

### nopeus/no-export-assignment

Rejects TypeScript's CommonJS `export = value` syntax; use named ESM exports or
`export default` instead. Enabled in both `/base` and `/effect`. The built-in
config supplies `typescript/no-require-imports` and `import/no-commonjs` for
CommonJS imports and JavaScript exports. The policy requires ESM source, not
ESM-only dependencies.

### nopeus/require-test-location

Test files belong under the nearest package's `test/` directory, alongside
`src/`, and use `.test` rather than `.spec` before their source extension.
The same policy applies to libraries and executable programs, regardless of
whether Oxlint runs from the repository root or a package directory.

Bad: `src/users/service.test.ts`, `tests/users.test.ts`, `test/users.spec.ts`.

Good: `test/users/service.test.ts`, `test/integration/users.test.ts`,
`test/e2e/server.test.ts`, `test/package/installation.test.ts`.

Module tests should mirror source paths, but the rule does not require a test
for each source file or prescribe feature folders. It recognizes `.test` and
`.spec` filenames with JS, JSX, TS, TSX, MJS, CJS, MTS, and CTS extensions;
it does not infer tests from arbitrary function calls. Files without a package
owner are skipped. Test helpers need no `.test` suffix.

### nopeus/no-test-imports

Files under a package's `src/` cannot import its `test/` resources, another
package's test resources, or legacy `tests/`, `__tests__`, and test/spec files.
This includes type-only imports, re-exports, literal dynamic imports, and
unshadowed `require` calls. Tests and root-level runner configs may use helpers.

Bad, in `src/users/service.ts`:

```ts
import { usersLayer } from "../../test/helpers/users-test-layer.ts";
```

Good, in `test/users/service.test.ts`:

```ts
import { make } from "../../src/users/service.ts";
import { usersLayer } from "../helpers/users-test-layer.ts";
```

Keep helpers under `test/helpers/` and inputs under `test/fixtures/` when they
need to be shared. Create those directories only when needed.

### nopeus/no-cross-package-internals

Cross-package imports must use the destination package's own name and public
entrypoints. Relative/absolute filesystem imports and TypeScript aliases cannot
reach into another package, even when the destination file is itself exported.
Tests retain access to their own package's private implementation.

Bad:

```ts
import { authenticate } from "../../auth/src/internal/authenticate.ts";
```

Good:

```ts
import { authenticate } from "@example/auth";
import { session } from "@example/auth/session";
```

Resolution uses `oxc-resolver`, including package export maps, conditional and
wildcard exports, symlinked workspaces, and automatically discovered tsconfig
paths. A cross-package alias is accepted only when it spells the destination's
public package entrypoint and resolves to the same file as that entrypoint.
Legacy packages without export maps may be imported through their root name;
deep imports require an explicit export map.

Manifests containing only `{"type":"module"}` or `{"type":"commonjs"}`
select a module format, not a separate package owner. Public exports into these
directories remain valid; other manifests still establish package boundaries.

The import rules inspect static imports/re-exports (including type-only forms),
TypeScript import types/import-equals, literal dynamic imports, and unshadowed
`require`. Computed module names, custom bundler-only aliases, and otherwise
unresolved bare imports remain outside this check; the compiler still owns
resolution errors. Resolution currently uses `types`, `import`, `node`, and
`default` conditions. It does not model arbitrary bundler custom conditions.
CommonJS syntax is rejected separately by the syntax policy; these boundary
checks do not attempt to resolve `require`-specific export conditions.

All three structure rules are errors in both `/base` and `/effect`. Include
both `src` and `test` in the consuming project's lint command. Narrowly exclude
deliberately invalid fixture projects, not ordinary test code. The built-in
config package supplies filename casing separately.

### nopeus/no-module-level-mutable-state

Rejects module-level `let`/`var` and direct construction of writable global
`Map`, `Set`, `WeakMap`, or `WeakSet` values. Service state belongs to construction.

Bad:

```ts
const cache = new Map<UserId, User>();
export const make = Effect.sync(() => buildUsers(cache));
```

Good:

```ts
export const make = Effect.sync(() => {
  const cache = new Map<UserId, User>();
  return buildUsers(cache);
});
```

Immutable lookup tables can use an explicit readonly contract:

```ts
const statusCodes: ReadonlyMap<string, number> = new Map([["ok", 200]]);
```

`satisfies ReadonlyMap` alone does not remove the mutable methods from an inferred
Map type and is not an exception. Imported persistent collection constructors
and function-local state remain allowed. This syntax-level rule does not infer
arbitrary factories, nested object state, clients, or mutation through aliases.
Explicitly owned process-wide mutable infrastructure needs a local exception.

In v4, separate `Effect.provide` calls can share memoized Layers. Construction
owns state per acquired service instance, not per provide call. Use `Layer.fresh`
or `Effect.provide(layer, { local: true })` only where isolation is intentional;
this rule does not require either mechanism.

### nopeus/require-fetch-abort-signal

Requires global `fetch` calls directly inside an `Effect.tryPromise` callback to
forward that callback's AbortSignal in a visible options object.

Bad:

```ts
Effect.tryPromise({
  try: () => fetch(url),
  catch: toRequestFailed,
});
```

Good:

```ts
Effect.tryPromise({
  try: (signal) => fetch(url, { ...requestOptions, signal }),
  catch: toRequestFailed,
});
```

Put `signal` after spreads and computed properties that could overwrite it.
`globalThis.fetch`, aliased Effect imports, renamed callback parameters, and
shadowed globals are handled. SDK methods and deferred nested callbacks are
outside this narrow rule. Prebuilt Request/options objects, combined signals,
and indirect signal aliases require an explicit local exception or forwarding
the callback parameter directly at the adapter boundary.

### nopeus/no-type-assertions

Rejects every non-const TypeScript assertion. A comment cannot prove a runtime
invariant, so the policy has no assertion escape hatch.

Bad:

```ts
const user = input as User;
```

Good:

```ts
const decodeUser = Schema.decodeUnknownSync(User);
const user = decodeUser(input);
```

Effect SQL, Drizzle, and other typed data APIs should carry their result types
without assertions. Const assertions remain allowed.

### nopeus/no-conditional-empty-object-spread

Rejects object spreads that use an empty object as one side of a conditional.
The omission is easier to review when it is expressed as an explicit mutation
of an owned object.

Bad:

```ts
const request = {
  url,
  ...(token === undefined ? {} : { token }),
};
```

Good:

```ts
const request: RequestOptions = { url };
if (token !== undefined) {
  request.token = token;
}
```

### nopeus/no-known-value-widening

Rejects explicit broad annotations that discard evidence already present in a
literal, constructor, function, or stable const binding.

Bad:

```ts
const request: object = {
  method: "GET",
  url,
};
```

Good:

```ts
const request = {
  method: "GET",
  url,
} satisfies RequestOptions;
```

Prefer inference or satisfies when the value is already known.

### nopeus/no-module-mocking

Rejects Vitest and Jest module mocking. Tests should replace dependencies
through the same interfaces and Effect Layers used by production code.

Bad:

```ts
vi.mock("./users.ts", () => ({
  findById: vi.fn(),
}));
```

Good:

```ts
const UsersTest = Layer.succeed(Users)({
  findById: () => Effect.succeed(testUser),
});

const program = loadUser("user-1").pipe(Effect.provide(UsersTest));
```

### nopeus/no-object-parameters

Rejects the broad object type on function parameters, including aliases that
resolve to object. Inputs need a named owner contract.

Bad:

```ts
function saveUser(user: object) {
  return repository.save(user);
}
```

Good:

```ts
interface SaveUserInput {
  readonly id: UserId;
  readonly name: string;
}

function saveUser(user: SaveUserInput) {
  return repository.save(user);
}
```

### nopeus/no-reflect-apply

Rejects Reflect.apply because it bypasses an ordinary typed function call.

Bad:

```ts
const result = Reflect.apply(handler, receiver, argumentsList);
```

Good:

```ts
const result = handler.call(receiver, request);
```

When dispatch is genuinely dynamic, put it behind a named typed interface.

### nopeus/no-reflect-get

Rejects Reflect.get because it turns property access into unchecked dynamic
lookup.

Bad:

```ts
const userId = Reflect.get(payload, "userId");
```

Good:

```ts
const payload = Schema.decodeUnknownSync(UserPayload)(input);
const userId = payload.userId;
```

### nopeus/no-runtime-typeof

Rejects runtime typeof checks. Primitive narrowing proves only a JavaScript
representation, not the domain contract expected by the application.

Bad:

```ts
if (typeof input === "string") {
  return input;
}
```

Good:

```ts
const decodeName = Schema.decodeUnknownEffect(Name);
const name = yield * decodeName(input);
```

Decode external input at its boundary, then branch on the decoded domain value.
Explicit type-guard and assertion-function bodies may use typeof because their
contract makes the narrowing boundary visible.

### nopeus/no-unknown-returns

Rejects explicit unknown, Promise of unknown, and local aliases that resolve to
unknown in function return contracts. Parsing responsibility belongs inside the
boundary function rather than with every caller.

Bad:

```ts
function parseUser(text: string): unknown {
  return JSON.parse(text);
}
```

Good:

```ts
function parseUser(text: string): User {
  return Schema.decodeUnknownSync(User)(JSON.parse(text));
}
```

### nopeus/no-unknown-type-aliases

Rejects aliases that merely hide unknown behind a domain-looking name.

Bad:

```ts
type UserPayload = unknown;
```

Good:

```ts
const UserPayload = Schema.Struct({
  id: UserId,
  name: Schema.String,
});

type UserPayload = typeof UserPayload.Type;
```

Unknown should remain visible at the parsing boundary.

### nopeus/no-unsafe-dictionary-type

Rejects dictionaries whose direct value type is unknown, any, object, an empty
object type, or an alias or union containing one of those escape hatches.

Bad:

```ts
type UsersById = Record<string, unknown>;
```

Good:

```ts
type UsersById = Readonly<Record<UserId, User>>;
```

Use a concrete owner type for dictionary values.

### nopeus/no-effect-runners-in-library

Rejects Effect runtime runners outside the files listed in
`runtimeEntryPoints`. Library modules should return Effects so callers retain
control of runtime configuration, interruption, and observability. Entrypoints
are exact repository-relative paths; `src/main.ts` does not allow a nested
`packages/example/src/main.ts`.

Bad outside an entrypoint:

```ts
export const loadUsers = () => Effect.runPromise(Users.all);
```

Good:

```ts
export const loadUsers = Users.all;

// src/main.ts, configured as a runtime entrypoint
Effect.runPromise(loadUsers);
```

### nopeus/no-fallible-effect-promise

Rejects Effect.promise. The canonical policy treats every external Promise as
potentially rejecting; Effect.tryPromise keeps rejection in the typed error
channel instead of turning it into a defect.

Bad:

```ts
const response = Effect.promise(() => fetch(url));
```

Good:

```ts
const response = Effect.tryPromise({
  try: () => fetch(url),
  catch: (cause) => new RequestFailed({ cause }),
});
```

### nopeus/no-inline-live-layer

Rejects live Layer constructors inside Effect.provide, including effectful and
context constructors nested in Layer composition. Build stable live Layers at
module scope and provide them at a composition boundary.

Bad:

```ts
const program = load.pipe(Effect.provide(Layer.effect(Users, makeUsers)));
```

Good:

```ts
export const usersLayer = Layer.effect(Users, makeUsers);

const program = load.pipe(Effect.provide(usersLayer));
```

### nopeus/no-unscoped-fork

Rejects Effect.forkDetach. Background work needs an explicit lifetime so
shutdown and interruption remain structured.

Bad:

```ts
yield * Effect.forkDetach(refreshCache);
```

Good:

```ts
yield * Effect.forkScoped(refreshCache);
```

Use Effect.forkIn when an existing Scope should own the fiber.

### nopeus/no-untyped-effect-errors

Rejects primitive values, object literals, and built-in error classes in
Effect.fail. This is a syntax-level rule: identifiers and custom error classes
remain valid, while the common ways of erasing domain error information are
rejected.

Bad:

```ts
yield * Effect.fail("user not found");
yield * Effect.fail(new Error("user not found"));
```

Good:

```ts
class UserNotFound extends Schema.TaggedError<UserNotFound>()("UserNotFound", {
  id: UserId,
}) {}

yield * new UserNotFound({ id });
```

### nopeus/prefer-effect-platform-services

Rejects direct Node filesystem, path, and child-process imports. Effect
platform services preserve typed failures and make platform behavior replaceable
with Layers in tests. Type-only imports remain allowed because they perform no
platform I/O.

Bad:

```ts
import { readFile } from "node:fs/promises";

const text = await readFile(path, "utf8");
```

Good:

```ts
import { Effect, FileSystem } from "effect";

const text = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  return yield* fs.readFileString(path);
});
```

Use Effect Path for path operations and `effect/unstable/process`
ChildProcess for process execution.

### nopeus/prefer-effect-void

Rejects Effect.succeed(undefined) and Effect.succeed(void 0). Effect.void is the
canonical shared value and makes intent immediate.

Bad:

```ts
const done = Effect.succeed(undefined);
```

Good:

```ts
const done = Effect.void;
```

### nopeus/require-effect-fn-name

Requires every Effect.fn call to begin with a static string name. When the
function has an owning binding or property, the trace name must equal that
symbol or end with a dot followed by that symbol. This permits both loadUser and
Users.loadUser while rejecting unrelated names. A variable containing a name is
not accepted because the trace boundary should be visible at the call.

Bad:

```ts
import * as Effect from "effect/Effect";

const loadUser = Effect.fn(function* (id: UserId) {
  return yield* Users.findById(id);
});
```

Good:

```ts
import * as Effect from "effect/Effect";

const loadUser = Effect.fn("@goho/loadUser")(function* (id: UserId) {
  return yield* Users.findById(id);
});
```

Effect.fnUntraced remains valid when tracing would not add value, particularly
in library implementations and hot paths.

### nopeus/require-effect-namespace

Requires static runtime identifiers under the prefix derived from the root package
name: both `goho` and `@adamaho/goho` use `@goho/`. The prefix must be followed by a
nonempty name. The Effect preset configures this rule automatically.

| APIs                                                                                                            | Checked identifier                                                     |
| --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `Context.Service`, `Context.Reference`                                                                          | Service/reference key, including curried services                      |
| `Effect.fn`                                                                                                     | Operation name; `require-effect-fn-name` also checks its owning symbol |
| `Effect.makeSpan`, `makeSpanScoped`, `useSpan`; `Layer.span`                                                    | Span name                                                              |
| `Effect.withSpan`, `withSpanScoped`, `withLogSpan`; `Layer`, `Stream`, `Channel`, `RequestResolver` `.withSpan` | Span name in data-first and data-last calls                            |
| `Schema.Class`, `Schema.Error`                                                                                  | Class identifier                                                       |
| `Schema.TaggedClass`, `Schema.TaggedError`                                                                      | Both the optional explicit identifier and the tag                      |
| `Schema.TaggedStruct`; `Data.TaggedClass`, `Data.TaggedError`; `Request.TaggedClass`, `Request.tagged`          | Tag                                                                    |
| `Metric.counter`, `gauge`, `frequency`, `histogram`, `summary`, `summaryWithTimestamp`, `timer`                 | Metric name                                                            |

```ts
import { Context, Effect, Schema } from "effect";

class Users extends Context.Service<Users, Users.Service>()("@goho/Users") {}
class ReadFailed extends Schema.TaggedError<ReadFailed>()("@goho/ReadFailed", {}) {}
const load = Effect.fn("@goho/Users.load")(function* () {
  /* ... */
});
```

The rule resolves imports from `effect` and direct `effect/Module` paths, including
aliases and `import * as E from "effect"`. Shadowed local bindings are ignored.
String literals and templates without interpolation are accepted, including
`satisfies` and type assertion wrappers. Variables and interpolated templates are
rejected even if their value might have the right prefix. Import bindings are
resolved directly; re-exports and locally assigned aliases are not followed.

This is an explicit catalogue of identifier APIs in the pinned Effect v4 version.
It does not interpret every string passed to Effect as a namespace: log messages,
configuration keys, schema literals, metric attributes, and ordinary domain values
remain unchanged. Unstable subpackages and arbitrary schema annotation objects
are outside this rule's catalogue.

When upgrading, prefix existing function names, keys and tags. Keep `Effect.fn`
names ending in the owning symbol (for example `@goho/load` or `@goho/Users.load`).
Update `catchTag`, match cases and serialized-data readers together with tag
changes; existing stored tags are not migrated by lint. Metric and span renames
also require corresponding dashboard/query updates. No automatic fix is offered
because identifiers can be persisted or referenced elsewhere.

### nopeus/require-service-key-prefix

The original service-only rule remains available for manually configured users.
The Effect preset now uses `require-effect-namespace` instead; replace the old rule
entry with the new name and retain the same `{ prefix: "@project/" }` option.
Avoid enabling both rules, which would duplicate service diagnostics.

### nopeus/require-service-constructor-names

Name exported Layers and Layer factories `layer` or `layerX`, and service
constructors `make` or `makeX`. The suffix starts with an uppercase letter:
`layerConfig`, `layerMemory`, and `makeServiceAccount` are valid;
`authLayer`, `defaultLayer`, `createAuth`, and `make_client` are not.
Use lowercase `layer` and `make`; uppercase `Layer` names the imported Effect
module.

Neither export requires the other, and suffixes do not need to match. A service
may expose only a Layer, only a constructor, or both. Constructors may remain
private. Layer values, parameterized factories, inline construction, config
wrappers, and composed layers are supported.

Bad:

```ts
export const createAuth = (options: Options) => Service.of(options);
export const authLayer = (options: Options) => Layer.succeed(Service, createAuth(options));
```

Good, with a reusable constructor:

```ts
export const make = (options: Options) => Service.of(options);
export const layer = (options: Options) => Layer.succeed(Service, make(options));
```

Good, with inline construction and no separate `make`:

```ts
export const layer = (options: Options) =>
  Layer.effect(
    Service,
    Effect.gen(function* () {
      const database = yield* Database;
      return Service.of({ find: (id) => database.find(id, options) });
    }),
  );
```

Good, resolving configuration through the existing constructor:

```ts
export const make = (options: Options) => Effect.succeed(Service.of(options));
export const layerConfig = (options: Config.Wrap<Options>) =>
  Layer.effect(Service, Config.unwrap(options).pipe(Effect.flatMap(make)));
```

Good, composing existing Layers without creating another service:

```ts
export const layer = (options: Options) =>
  Layer.merge(Auth.layer(options.auth), Database.layer(options.database));
```

This syntax rule recognizes imported Effect Layer constructors/composition,
local service `.of` construction, constructors passed to `Layer.effect`,
`Layer.succeed`, or `Layer.sync`, and explicit Layer/service return types.
It follows local aliases and returned expressions, including Effect generators
and functions. Local export aliases are checked by their public name; recognized
constructors must use named exports rather than a default export.

Private helpers and unrelated functions are not subject to this naming rule.
Opaque imported factories, cross-file re-exports, and arbitrary type inference
are outside the syntax check. An explicit `Layer.Layer<...>` return annotation
makes an otherwise opaque Layer factory recognizable. The rule does not verify
construction behavior or require particular files, interfaces, or export pairs.

This replaces `require-service-make-layer`; the old rule is removed, not retained
as an optional policy. The naming rule is always enabled in the Effect preset.

## Credits

The initial policy and rule set were inspired by
[anti-slop](https://github.com/dmmulroy/anti-slop).
