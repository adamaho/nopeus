import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "vitest";

const packageRoot = fileURLToPath(new URL("../", import.meta.url));
const tsc = join(dirname(fileURLToPath(import.meta.resolve("typescript/package.json"))), "bin/tsc");

const valid = `
import { Context, Effect, Layer, Schema } from "effect";
import { it } from "@effect/vitest";
import { expect } from "vitest";

const User = Schema.Struct({ id: Schema.String });
type User = typeof User.Type;
class ReadFailed extends Schema.TaggedError<ReadFailed>()("ReadFailed", { cause: Schema.Unknown }) {}
interface UsersApi { readonly load: (id: string) => Effect.Effect<User, ReadFailed> }
class Database extends Context.Service<Database, UsersApi>()("@fixture/Database") {}

/** @internal */
export class Users extends Context.Service<Users, UsersApi>()("@fixture/Users") {}
/** @internal */
export const make = Effect.gen(function* () {
  const database = yield* Database;
  const cache = new Map<string, User>();
  return Users.of({ load: id => database.load(id).pipe(Effect.tap(user => Effect.sync(() => { cache.set(id, user); }))) });
});
/** @internal */
export const layer = Layer.effect(Users, make);
/** @internal */
export const request = (url: string) => Effect.tryPromise({
  try: signal => fetch(url, { signal }),
  catch: cause => new ReadFailed({ cause }),
});
/** @internal */
export const codes: ReadonlyMap<string, number> = new Map([["ok", 200]]);
it.effect("decodes a user", () => Effect.gen(function* () {
  const user = yield* Schema.decodeUnknownEffect(User)({ id: "1" });
  expect(user.id).toBe("1");
}));
`;

const invalid = [
  ["floatingEffect", "TS377001", 'import { Effect } from "effect"; Effect.log("forgotten");'],
  [
    "returnEffectInGen",
    "TS377014",
    'import { Effect } from "effect"; export const run = Effect.gen(function* () { return Effect.succeed(1); });',
  ],
  [
    "effectInVoidSuccess",
    "TS377020",
    'import { Effect } from "effect"; export const run: Effect.Effect<void> = Effect.succeed(Effect.log("forgotten"));',
  ],
  [
    "lazyPromiseInEffectSync",
    "TS377082",
    'import { Effect } from "effect"; export const run = Effect.sync(() => Promise.resolve(1));',
  ],
  [
    "promiseInEffectSuccess",
    "TS377108",
    'import { Effect } from "effect"; export const run = Effect.succeed(Promise.resolve(1));',
  ],
  [
    "schemaSyncInEffect",
    "TS377037",
    'import { Effect, Schema } from "effect"; const User = Schema.Struct({ id: Schema.String }); export const run = Effect.gen(function* () { return Schema.decodeUnknownSync(User)({ id: "1" }); });',
  ],
  [
    "leakingRequirements",
    "TS377041",
    'import { Context, Effect } from "effect"; class Database extends Context.Service<Database, {}>()("@fixture/Database") {} export class Users extends Context.Service<Users, { readonly load: Effect.Effect<string, never, Database>; readonly save: () => Effect.Effect<void, never, Database> }>()("@fixture/Users") {}',
  ],
  [
    "floatingEffectInVitest",
    "TS377105",
    'import { it } from "@effect/vitest"; import { Effect } from "effect"; it("forgotten", () => Effect.void);',
  ],
] as const;

function typecheck(code: string, useEffect = true) {
  const directory = mkdtempSync(join(packageRoot, ".effect-v4-"));
  try {
    writeFileSync(
      join(directory, "tsconfig.json"),
      JSON.stringify({
        extends: useEffect ? ["../src/base.json", "../src/effect.json"] : "../src/base.json",
        compilerOptions: { module: "NodeNext", moduleResolution: "NodeNext" },
        files: ["fixture.test.ts"],
      }),
    );
    writeFileSync(join(directory, "fixture.test.ts"), code);
    return spawnSync(
      process.execPath,
      [tsc, "--project", join(directory, "tsconfig.json"), "--pretty", "false"],
      {
        cwd: directory,
        encoding: "utf8",
        timeout: 60_000,
      },
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test("patched tsc accepts valid Effect v4 code with the shared policy", () => {
  const result = typecheck(valid);
  expect(result.error).toBeUndefined();
  expect(result.status, result.stdout + result.stderr).toBe(0);
}, 60_000);

test.each(invalid)(
  "%s fails tsc with its Effect diagnostic",
  (_name, diagnostic, code) => {
    const result = typecheck(code);
    const output = result.stdout + result.stderr;
    expect(result.error).toBeUndefined();
    expect(result.status, output).toBeGreaterThan(0);
    expect(output).toContain("error " + diagnostic + ":");
  },
  60_000,
);

test("base compiler policy does not activate Effect diagnostics", () => {
  const result = typecheck(
    'import { Effect } from "effect"; Effect.log("not a compiler error without the Effect preset");',
    false,
  );
  expect(result.error).toBeUndefined();
  expect(result.status, result.stdout + result.stderr).toBe(0);
}, 60_000);
