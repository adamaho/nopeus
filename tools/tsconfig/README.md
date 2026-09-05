# @nopeus/tool-tsconfig

Shared TypeScript configurations and Effect LSP-based linting for this workspace.

## Workspace setup

- `@nopeus/tool-tsconfig/base`: strict compiler defaults, without Effect diagnostics.
- `@nopeus/tool-tsconfig/service`: NodeNext defaults for backend workspaces.
- `@nopeus/tool-tsconfig/app-vite`: bundler and React defaults for Vite workspaces.
- `@nopeus/tool-tsconfig/effect`: opt-in Effect LSP policy, layered after a base config.

Add `@nopeus/tool-tsconfig` with `workspace:*` to a package's devDependencies,
then extend the relevant config:

```json
{
  "extends": "@nopeus/tool-tsconfig/service",
  "include": ["src/**/*.ts"]
}
```

The base, service, and app-vite configs do not activate Effect diagnostics.
Effect projects explicitly add the Effect overlay:

```json
{
  "extends": ["@nopeus/tool-tsconfig/service", "@nopeus/tool-tsconfig/effect"],
  "include": ["src/**/*.ts"]
}
```

The workspace's `pnpm install` runs the existing `effect-tsgo patch` preparation
step for development and compiler tests. Selected Effect errors fail `tsc` only
in projects opting into the overlay. `pnpm check` runs compiler checks and Oxlint.
A child config that sets `compilerOptions.plugins` replaces the inherited array;
keep the Effect entry when opting into its diagnostics alongside other plugins.

This is private workspace tooling. Users of the published Oxlint packages do
not install its development dependencies or run its preparation script.

## Effect v4 LSP-based linting

Nopeus uses the official [Effect TypeScript-Go integration](https://github.com/Effect-TS/tsgo).
It runs Effect diagnostics during TypeScript checking and exposes the same
policy to editors using the Effect language server. This avoids a second
type-analysis pass through Oxlint. No Oxlint patch or `oxlint-tsgolint`
dependency is required.

The tested versions are `@effect/tsgo@0.41.0` and `typescript@7.0.2`. Examples and
consumer tests target `effect@4.0.0-rc.112` and `@effect/vitest@4.0.0-rc.112`.
Update TypeScript and the Effect integration together within upstream's supported
versions. Effect and the test adapter are fixture dependencies here; the Oxlint
plugin does not require consumers to install them as tooling peers.

### External projects

This shared config package is private to the workspace. External projects can
apply the same compiler policy directly:

```bash
pnpm add --save-dev @effect/tsgo@0.41.0 typescript@7.0.2
```

Add the patch to the project's preparation script and retain existing preparation
commands:

```json
{
  "scripts": {
    "prepare": "effect-tsgo patch",
    "typecheck": "tsc --noEmit"
  }
}
```

Add the following Effect entry to `compilerOptions.plugins` in the project's
shared tsconfig, preserving any other plugins:

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "@effect/language-service",
        "diagnostics": true,
        "ignoreEffectErrorsInTscExitCode": false,
        "diagnosticSeverity": {
          "floatingEffect": "error",
          "returnEffectInGen": "error",
          "effectInVoidSuccess": "error",
          "lazyPromiseInEffectSync": "error",
          "promiseInEffectSuccess": "error",
          "schemaSyncInEffect": "error",
          "leakingRequirements": "error",
          "floatingEffectInVitest": "error"
        }
      }
    ]
  }
}
```

Run `pnpm install`, then `pnpm typecheck`. CI must run installation scripts before
checking. The patch is required: an unpatched compiler does not enforce these
Effect diagnostics just because the plugin appears in tsconfig. The tests in
this package invoke the installed `tsc` and assert both a nonzero exit code and
the specific Effect error for every selected diagnostic.

### Editor support

Configure the editor to use Effect's language server with the official guided
setup, `pnpm exec effect-tsgo setup`, and follow its editor-specific instructions.
Use the same project tsconfig as CI and keep `diagnostics: true`. Patching the
compiler alone does not configure an editor's language-server selection. See
[upstream setup and editor guidance](https://github.com/Effect-TS/tsgo#installation).

## Effect v4 diagnostics

The opt-in Effect overlay promotes these eight upstream diagnostics to errors. Existing
upstream defaults remain in effect for other diagnostics. Errors fail `tsc`;
unpromoted suggestions remain advisory.

| Rule                       | Required behavior                                                      |
| -------------------------- | ---------------------------------------------------------------------- |
| `floatingEffect`           | Yield, return, or retain Effect values instead of discarding them.     |
| `returnEffectInGen`        | Execute returned Effects with `return yield*` inside generators.       |
| `effectInVoidSuccess`      | Do not hide unexecuted Effects in a void success channel.              |
| `lazyPromiseInEffectSync`  | Keep Promise-returning callbacks out of `Effect.sync`.                 |
| `promiseInEffectSuccess`   | Await Promise work through an Effect adapter, not a success value.     |
| `schemaSyncInEffect`       | Decode through the typed Effect error channel inside Effect workflows. |
| `leakingRequirements`      | Capture implementation dependencies when constructing a service.       |
| `floatingEffect-in-vitest` | Run Effect tests through an Effect-aware test API.                     |

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
