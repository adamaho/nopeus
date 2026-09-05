import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "vitest";

const packageRoot = fileURLToPath(new URL("../", import.meta.url));
const oxlint = join(
  dirname(fileURLToPath(import.meta.resolve("oxlint/package.json"))),
  "bin/oxlint",
);

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
  ["no-module-level-mutable-state", "export const cache = new Map<string, string>();"],
  [
    "require-fetch-abort-signal",
    'import { Effect } from "effect"; export const run = Effect.tryPromise({ try: () => fetch("https://example.com"), catch: cause => cause });',
  ],
] as const;

test("the syntax policy accepts v4 code and executes both added rules", () => {
  const directory = mkdtempSync(join(packageRoot, ".effect-v4-"));
  try {
    writeFileSync(
      join(directory, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          target: "ES2022",
          module: "NodeNext",
          moduleResolution: "NodeNext",
          strict: true,
          noEmit: true,
          skipLibCheck: true,
        },
        include: ["*.ts"],
      }),
    );
    writeFileSync(
      join(directory, "oxlint.config.ts"),
      `
      import effect from "../src/effect.ts";
      export default effect({ packageName: "fixture" });
    `,
    );
    writeFileSync(join(directory, "valid.test.ts"), valid);
    const run = (files: readonly string[]) =>
      spawnSync(
        process.execPath,
        [oxlint, "--config", join(directory, "oxlint.config.ts"), "--format", "json", ...files],
        { cwd: directory, encoding: "utf8", timeout: 60_000 },
      );

    const accepted = run(["valid.test.ts"]);
    expect(accepted.error).toBeUndefined();
    expect(accepted.status, accepted.stdout + accepted.stderr).toBe(0);

    for (const [rule, code] of invalid) {
      const filename = rule + ".test.ts";
      writeFileSync(join(directory, filename), code);
      const rejected = run([filename]);
      expect(rejected.error).toBeUndefined();
      expect(rejected.status, rejected.stdout + rejected.stderr).toBe(1);
      const output = JSON.parse(rejected.stdout);
      expect.soft(output.diagnostics, rule).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: expect.stringContaining(rule),
            filename: expect.stringContaining(rule + ".test.ts"),
          }),
        ]),
      );
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}, 120_000);

test("constructor naming checks stay independent across files", () => {
  const directory = mkdtempSync(join(packageRoot, ".constructor-names-"));
  try {
    writeFileSync(
      join(directory, "oxlint.json"),
      JSON.stringify({
        jsPlugins: [{ name: "nopeus", specifier: join(packageRoot, "src/index.ts") }],
        rules: { "nopeus/require-service-constructor-names": "error" },
      }),
    );
    for (const name of ["InvalidA", "InvalidB"]) {
      writeFileSync(
        join(directory, name + ".ts"),
        `import { Context, Layer } from "effect";
         export class Service extends Context.Service<Service, {}>()("@fixture/${name}") {}
         export const authLayer = () => Layer.succeed(Service, {});`,
      );
    }
    writeFileSync(
      join(directory, "factory.ts"),
      `import { Context, Layer } from "effect";
       export class Service extends Context.Service<Service, {}>()("@fixture/Auth") {}
       export function layer(options: Options) { return Layer.succeed(Service, options); }`,
    );
    const result = spawnSync(
      process.execPath,
      [
        oxlint,
        "--config",
        "oxlint.json",
        "--no-ignore",
        "--threads",
        "1",
        "--format",
        "json",
        "InvalidA.ts",
        "factory.ts",
        "InvalidB.ts",
      ],
      { cwd: directory, encoding: "utf8", timeout: 60_000 },
    );
    expect(result.error).toBeUndefined();
    expect(result.status, result.stdout + result.stderr).toBe(1);
    const { diagnostics } = JSON.parse(result.stdout);
    expect(diagnostics, result.stdout).toHaveLength(2);
    for (const name of ["InvalidA", "InvalidB"]) {
      expect(diagnostics).toContainEqual(
        expect.objectContaining({
          filename: expect.stringContaining(name + ".ts"),
          code: expect.stringContaining("require-service-constructor-names"),
          message: expect.stringContaining("Name this exported Layer"),
        }),
      );
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}, 60_000);
