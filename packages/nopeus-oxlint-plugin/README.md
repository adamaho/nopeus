# @adamaho/nopeus-oxlint-plugin

The canonical strict Oxlint policy for AI-assisted TypeScript codebases.

Nopeus is intentionally all or nothing. It exposes one supported configuration,
enables every shipped rule at error severity, and applies the same policy to
production and test code. There are no partial presets or blanket test
overrides.

The package combines and adapts the MIT-licensed rules from
[dmmulroy/anti-slop](https://github.com/dmmulroy/anti-slop) and
[HumanLayer's Effect Machine](https://github.com/humanlayer/effect-machine/tree/main/tools/oxlint/anti-slop).
Its public API documentation rule follows the format enforced by
[Effect's JSDoc checker](https://github.com/Effect-TS/effect/tree/main/packages/tools/jsdocs).

## Usage

Install Nopeus and its Oxlint peer:

```bash
pnpm add --save-dev @adamaho/nopeus-oxlint-plugin oxlint
```

Extend the canonical policy from an oxlint.config.ts file:

```ts
import packageJson from "./package.json" with { type: "json" };
import nopeus from "@adamaho/nopeus-oxlint-plugin/config";
import { defineConfig } from "oxlint";

export default defineConfig({
  extends: [nopeus({ packageName: packageJson.name })],
});
```

The root package name defines the owned Effect service namespace. Both goho and
@adamaho/goho require service keys beginning with @goho/.

The package publishes TypeScript source and therefore requires Node.js 22.18 or
newer, or Node.js 24 or newer, where type stripping is enabled by default.

## Policy

Nopeus preserves type evidence from input boundary to use site. Unknown input is
valid at an I/O boundary, where it should be decoded with Schema or another
parser. After decoding, code should carry named domain types rather than widen,
erase, and reconstruct them.

Effect rules follow the current Effect conventions:

- Use Effect.fn with a static trace name for traced reusable operations.
- Use Effect.fnUntraced for library implementations and hot paths that do not
  represent a useful tracing boundary.
- Define services with Context.Service and a static repository-owned key.
- Importing from either the effect barrel or the effect/Effect and
  effect/Context module paths is supported.

Every rule below is enabled by the canonical config.

## Rules

### nopeus/no-chained-type-assertions

Rejects nested TypeScript assertions. A chain such as value as unknown as User
erases the original evidence before inventing a new type.

Bad:

```ts
const user = input as unknown as User;
```

Good:

```ts
const decodeUser = Schema.decodeUnknownSync(User);
const user = decodeUser(input);
```

Const assertions remain allowed.

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

### nopeus/no-widen-then-assert

Rejects immutable local flows that widen a known value and later assert the
widened binding back to a narrower type.

Bad:

```ts
const preciseUser = { id: userId, name };
const value: unknown = preciseUser;
const user = value as User;
```

Good:

```ts
const user = {
  id: userId,
  name,
} satisfies User;
```

Keep the precise type from initialization through use.

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

### nopeus/require-safety-comment-for-type-assertion

Requires every non-const TypeScript assertion to have a nearby SAFETY comment
that states the invariant TypeScript cannot express. Decoding is preferred; the
comment is for rare invariants established outside the type system.

Bad:

```ts
const first = rows[0] as UserRow;
```

Good:

```ts
// SAFETY: the query schema guarantees at least one UserRow.
const first = rows[0] as UserRow;
```

The comment must immediately precede the assertion or its containing statement.

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

## Exceptions

The canonical config does not disable rules for tests or offer partial presets.
When an exceptional invariant is real, prefer the narrow mechanism built into
the rule, such as a SAFETY comment for an assertion. Any project-level Oxlint
disable should be local, documented, and reviewed as an explicit departure from
the canonical policy.
