import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "vitest";

const repository = fileURLToPath(new URL("../../../", import.meta.url));

function run(cwd: string, args: readonly string[], expectFailure = false) {
  const result = spawnSync("pnpm", args, { cwd, encoding: "utf8", timeout: 120_000 });
  expect(result.error).toBeUndefined();
  if (expectFailure) {
    expect(result.status, result.stdout + result.stderr).toBeGreaterThan(0);
  } else {
    expect(result.status, result.stdout + result.stderr).toBe(0);
  }
  return result.stdout + result.stderr;
}

function version(name: string): string {
  return JSON.parse(
    readFileSync(fileURLToPath(import.meta.resolve(name + "/package.json")), "utf8"),
  ).version;
}

test("packed configs work in base-only and Effect projects", () => {
  const directory = mkdtempSync(join(tmpdir(), "nopeus-tsconfig-consumer-"));
  try {
    const tarball = join(directory, "nopeus-tsconfig.tgz");
    run(join(repository, "packages/nopeus-tsconfig"), ["pack", "--out", tarball]);
    const root = JSON.parse(readFileSync(join(repository, "package.json"), "utf8"));
    const manifest = {
      private: true,
      type: "module",
      packageManager: root.packageManager,
      devDependencies: {
        "@adamaho/nopeus-tsconfig": "file:./nopeus-tsconfig.tgz",
        typescript: version("typescript"),
      },
    };
    writeFileSync(join(directory, "package.json"), JSON.stringify(manifest));
    run(directory, ["install", "--no-frozen-lockfile"]);

    expect(
      readdirSync(join(directory, "node_modules/.pnpm")).filter((name) =>
        /^(?:effect@|@effect\+)/u.test(name),
      ),
    ).toEqual([]);
    const installed = join(directory, "node_modules/@adamaho/nopeus-tsconfig");
    expect(readdirSync(installed).sort()).toEqual([
      "LICENSE",
      "README.md",
      "base.json",
      "effect.json",
      "package.json",
    ]);

    const check = (preset: string, code: string, expectFailure = false) => {
      writeFileSync(
        join(directory, "tsconfig.json"),
        JSON.stringify({
          extends: "@adamaho/nopeus-tsconfig/" + preset,
          compilerOptions: { module: "NodeNext", moduleResolution: "NodeNext" },
          files: ["fixture.ts"],
        }),
      );
      writeFileSync(join(directory, "fixture.ts"), code);
      return run(directory, ["exec", "tsc", "--pretty", "false"], expectFailure);
    };

    check("base", 'export const message: string = "hello";');
    expect(check("base", "export const message: string = undefined;", true)).toContain("TS2322");
    expect(
      check("base", "export const options: { name?: string } = { name: undefined };", true),
    ).toContain("TS2375");
    expect(
      check("base", "const values: string[] = []; export const first: string = values[0];", true),
    ).toContain("TS2322");

    // Match the repository's approval for the Effect compiler's native dependency.
    writeFileSync(
      join(directory, "pnpm-workspace.yaml"),
      "allowBuilds:\n  msgpackr-extract: true\n",
    );
    writeFileSync(
      join(directory, "package.json"),
      JSON.stringify({
        ...manifest,
        devDependencies: {
          ...manifest.devDependencies,
          "@effect/tsgo": version("@effect/tsgo"),
          effect: version("effect"),
        },
      }),
    );
    run(directory, ["install", "--no-frozen-lockfile"]);
    run(directory, ["exec", "effect-tsgo", "patch"]);
    check(
      "effect",
      'import { Effect } from "effect"; export const program = Effect.log("retained");',
    );
    expect(check("effect", "export const message: string = undefined;", true)).toContain("TS2322");
    const floating = 'import { Effect } from "effect"; Effect.log("discarded");';
    expect(check("effect", floating, true)).toContain("TS377001");
    check("base", floating);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}, 240_000);
