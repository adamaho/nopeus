# @adamaho/nopeus-oxlint-plugin

Strict Oxlint rules for AI-assisted TypeScript codebases. The `effect` profile
applies one complete policy to production and test code.

## Usage

Install Nopeus and its compatible type-aware toolchain:

```bash
pnpm add --save-dev @adamaho/nopeus-oxlint-plugin @effect/tsgo@0.41.0 oxlint@1.79.0 oxlint-tsgolint@7.0.2001
```

Add the following to the consuming repository's `package.json`, then run
`pnpm install`:

```json
{
  "scripts": {
    "prepare": "effect-tsgo patch --no-typescript --oxlint"
  }
}
```

Merge this command into an existing prepare script rather than replacing its
other work. The patch installs the Effect-aware engine; enabling rule names alone
does not install it. CI must run this preparation after dependency installation.
The profile enables type-aware mode itself and requires a TypeScript project.
The three toolchain versions above are tested together; upgrade them together
when changing the supported integration. This release's examples and consumer
tests use `effect@4.0.0-rc.112` and `@effect/vitest@4.0.0-rc.112`.

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
@adamaho/goho require service keys beginning with @goho/.

The package publishes compiled ESM and requires Node.js 22.18 or newer, or
Node.js 24 or newer.

## Rules

### Effect v4 type-aware checks

The canonical profile adds these upstream `effecttsgo` diagnostics as errors.
It does not import an entire upstream preset or add v3-only conventions.

| Rule                                     | Required behavior                                                      |
| ---------------------------------------- | ---------------------------------------------------------------------- |
| `effecttsgo/floating-effect`             | Yield, return, or retain Effect values instead of discarding them.     |
| `effecttsgo/return-effect-in-gen`        | Execute returned Effects with `return yield*` inside generators.       |
| `effecttsgo/effect-in-void-success`      | Do not hide unexecuted Effects in a void success channel.              |
| `effecttsgo/lazy-promise-in-effect-sync` | Keep Promise-returning callbacks out of `Effect.sync`.                 |
| `effecttsgo/promise-in-effect-success`   | Await Promise work through an Effect adapter, not a success value.     |
| `effecttsgo/schema-sync-in-effect`       | Decode through the typed Effect error channel inside Effect workflows. |
| `effecttsgo/leaking-requirements`        | Capture implementation dependencies when constructing a service.       |
| `effecttsgo/floating-effect-in-vitest`   | Run Effect tests through an Effect-aware test API.                     |

Bad inside an Effect generator:

```ts
saveUser(user);
return loadUser(id);
```

Good:

```ts
yield * saveUser(user);
return yield * loadUser(id);
```

Bad Promise adapters:

```ts
const user = Effect.sync(() => client.loadUser(id));
const alsoNested = Effect.succeed(client.loadUser(id));
```

Good:

```ts
const user = Effect.tryPromise({
  try: () => client.loadUser(id),
  catch: (cause) => new LoadUserFailed({ cause }),
});
```

Bad decoding inside `Effect.gen`:

```ts
const user = Schema.decodeUnknownSync(User)(input);
```

Good, using the v4 Effect-returning decoder:

```ts
const user = yield * Schema.decodeUnknownEffect(User)(input);
```

Synchronous decoders remain available at intentionally synchronous boundaries.

Bad service contract:

```ts
class Users extends Context.Service<
  Users,
  {
    readonly find: (id: UserId) => Effect.Effect<User, UserNotFound, Database>;
    readonly save: (user: User) => Effect.Effect<void, SaveFailed, Database>;
  }
>()("@app/Users") {}
```

Good: `make` captures `Database`, so every caller does not need to supply it:

```ts
class Users extends Context.Service<
  Users,
  {
    readonly find: (id: UserId) => Effect.Effect<User, UserNotFound>;
    readonly save: (user: User) => Effect.Effect<void, SaveFailed>;
  }
>()("@app/Users") {}
```

The upstream dependency-leak check is a heuristic: it reports a dependency shared
by every Effect member when the service has at least two such members. It does
not catch single-method services or dependencies shared by only some methods.
Scope is already excluded. For intentional caller-owned requirements, document
the reason and use `@effect-expect-leaking RequestContext` on the service or
`@effect-leakable-service` on the dependency declaration. Intentionally returning
an Effect as data needs a local exception to the corresponding execution check.
Do not erase requirements with a cast.

Bad test:

```ts
import { it } from "@effect/vitest";

it("saves a user", () => saveUser(user));
```

Good:

```ts
import { it } from "@effect/vitest";

it.effect("saves a user", () => saveUser(user));
```

Ordinary synchronous and Promise-based tests can still use ordinary Vitest.

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

const loadUser = Effect.fn("loadUser")(function* (id: UserId) {
  return yield* Users.findById(id);
});
```

Effect.fnUntraced remains valid when tracing would not add value, particularly
in library implementations and hot paths.

### nopeus/require-public-jsdoc

Requires every named public export to have the public API JSDoc format used by
Effect. Default exports are ignored, as are declarations explicitly marked
@internal.

Bad:

```ts
/** Fetches a user. */
export const getUser = (id: UserId) => Users.findById(id);
```

Good:

````ts
/**
 * Fetches a user by identifier.
 *
 * **When to use**
 *
 * Use when the caller needs the complete user record.
 *
 * **Gotchas**
 *
 * Fails with `UserNotFound` when the identifier is unknown.
 *
 * **Example** (Fetch a known user)
 *
 * ```ts
 * const user = yield* getUser(userId)
 * ```
 *
 * @see {@link findOptionalUser}
 * @category models
 * @since 1.0.0
 */
export const getUser = Effect.fn("getUser")(function* (id: UserId) {
  return yield* Users.findById(id);
});
````

The comment contract is deliberately narrow:

- Start with one practical description paragraph.
- Optional sections appear once and in this order: **When to use**, **Details**,
  **Gotchas**. A **When to use** body starts with `Use to`, `Use when`, `Use as`,
  or `Use with`.
- Examples use `**Example** (Unique title)` and exactly one non-empty TypeScript
  fence. The `@example` tag and loose TypeScript fences are rejected.
- Tags appear in this order: `@deprecated`, repeated `@see`, `@category`, then
  `@since`. Category must be non-empty and since must be a stable `x.y.z`
  version. Other tags are rejected.
- Descriptions, sections, examples, and tags are separated by exactly one blank
  line.

Oxlint cannot perform Effect's separate type-aware link resolution or execute
documentation examples. This rule enforces the authoring format at lint time;
projects may additionally run doctests for executable examples.

### nopeus/require-service-key-prefix

Requires every Context.Service key to be a static string inside the namespace
owned by the consuming repository. The prefix is derived from the root package
name passed to the canonical config.

Bad in a repository named goho:

```ts
import { Context } from "effect";

class Users extends Context.Service<Users, Users.Service>()("@other/Users") {}
```

Good:

```ts
import { Context } from "effect";

class Users extends Context.Service<Users, Users.Service>()("@goho/Users") {}
```

The rule checks both curried and direct Context.Service forms, the effect barrel,
namespace imports from effect/Context, and direct Service imports. Static string
literals wrapped with satisfies are accepted; variables and computed keys are
rejected.

### nopeus/require-service-make-layer

Requires every exported Context.Service class to have an exported module-level
constructor and a matching exported Layer. The unsuffixed pair is `make` and
`layer` (or `defaultLayer`); named implementations pair by suffix, such as
`makeMemory` and `layerMemory`.

Bad:

```ts
export class Users extends Context.Service<Users, Interface>()("@goho/Users") {}

export const layer = Layer.effect(
  Users,
  Effect.gen(function* () {
    const database = yield* Database;
    return Users.of({ find: (id) => database.findUser(id) });
  }),
);
```

Good:

```ts
export interface Interface {
  readonly find: (id: UserId) => Effect.Effect<User, UserNotFound>;
}

export class Users extends Context.Service<Users, Interface>()("@goho/Users") {}

export const make = Effect.gen(function* () {
  const database = yield* Database;
  return Users.of({ find: (id) => database.findUser(id) });
});

export const layer = Layer.effect(Users, make);
```

The rule does not require the interface name `Interface`, a namespace
self-reexport, or one particular file layout. Those are useful module
conventions, but the enforceable architectural contract is that implementation
construction is reusable independently from Layer composition.

## Exceptions

Canonical profiles do not disable rules for tests or offer partial presets. Any
project-level Oxlint disable should be local, documented, and reviewed as an
explicit departure from the canonical policy.

## Credits

The initial policy and rule set were inspired by
[anti-slop](https://github.com/dmmulroy/anti-slop).
