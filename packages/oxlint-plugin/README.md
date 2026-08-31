# @nopeus/oxlint-plugin

Strict Oxlint rules for AI-assisted TypeScript codebases. The `effect` profile
applies one complete policy to production and test code.

## Usage

Install Nopeus and its Oxlint peer:

```bash
pnpm add --save-dev @nopeus/oxlint-plugin oxlint
```

Extend the canonical policy from an oxlint.config.ts file:

```ts
import packageJson from "./package.json" with { type: "json" };
import effect from "@nopeus/oxlint-plugin/effect";
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

The package publishes TypeScript source and therefore requires Node.js 22.18 or
newer, or Node.js 24 or newer, where type stripping is enabled by default.

## Rules

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
const decodeName = Schema.decodeUnknown(Name);
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
class UserNotFound extends Schema.TaggedErrorClass<UserNotFound>()("UserNotFound", {
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
