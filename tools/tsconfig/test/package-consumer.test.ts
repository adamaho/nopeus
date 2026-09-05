import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
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

function version(name: string, from = import.meta.url): string {
  return JSON.parse(readFileSync(createRequire(from).resolve(name + "/package.json"), "utf8"))
    .version;
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
        "@types/node": version("@types/node"),
        vite: version("vite", import.meta.resolve("vitest/package.json")),
      },
    };
    // Match the repository's build approvals for the fixture dependencies.
    writeFileSync(
      join(directory, "pnpm-workspace.yaml"),
      "allowBuilds:\n  esbuild: true\n  msgpackr-extract: true\n",
    );
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
      "node.json",
      "package.json",
      "vite.json",
    ]);

    const check = (preset: string, code: string, expectFailure = false, environment = "node") => {
      writeFileSync(
        join(directory, "tsconfig.json"),
        JSON.stringify({
          extends: [
            "@adamaho/nopeus-tsconfig/" + preset,
            "@adamaho/nopeus-tsconfig/" + environment,
          ],
          files: ["fixture.ts"],
        }),
      );
      writeFileSync(join(directory, "fixture.ts"), code);
      return run(directory, ["exec", "tsc", "--pretty", "false"], expectFailure);
    };

    writeFileSync(join(directory, "dependency.ts"), "export const value = 1;\n");
    check("base", 'import { cwd } from "node:process"; export const directory = cwd();');
    expect(check("base", "export const page = window.location;", true)).toContain("TS2304");
    check("base", 'export { value } from "./dependency.js";');
    expect(check("base", 'export { value } from "./dependency";', true)).toContain("TS2835");
    check("base", 'export { value } from "./dependency";', false, "vite");
    check(
      "base",
      'import logo from "./logo.svg"; document.title = import.meta.env.MODE; export { logo }; export const query = [...new URLSearchParams("q=test")];',
      false,
      "vite",
    );
    check("base", "export const directory = process.cwd();", true, "vite");

    for (const environment of ["node", "vite"]) {
      check("base", 'export const message: string = "hello";', false, environment);
      expect(
        check("base", "export const message: string = undefined;", true, environment),
      ).toContain("TS2322");
      expect(
        check(
          "base",
          "export const options: { name?: string } = { name: undefined };",
          true,
          environment,
        ),
      ).toContain("TS2375");
      expect(
        check(
          "base",
          "const values: string[] = []; export const first: string = values[0];",
          true,
          environment,
        ),
      ).toContain("TS2322");
    }

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
    for (const environment of ["node", "vite"]) {
      check(
        "effect",
        'import { Effect } from "effect"; export const program = Effect.log("retained");',
        false,
        environment,
      );
      expect(
        check("effect", "export const message: string = undefined;", true, environment),
      ).toContain("TS2322");
      const floating = 'import { Effect } from "effect"; Effect.log("discarded");';
      expect(check("effect", floating, true, environment)).toContain("TS377001");
      check("base", floating, false, environment);
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}, 240_000);
