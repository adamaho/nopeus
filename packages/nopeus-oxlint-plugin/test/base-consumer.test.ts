import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "vitest";

const repository = fileURLToPath(new URL("../../../", import.meta.url));

function run(cwd: string, command: string, args: readonly string[]) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8", timeout: 120_000 });
  expect(result.error).toBeUndefined();
  expect(result.status, result.stdout + result.stderr).toBe(0);
  return result.stdout;
}

test("published base presets install and lint without Effect packages", () => {
  const directory = mkdtempSync(join(tmpdir(), "nopeus-base-consumer-"));
  try {
    for (const name of ["nopeus-oxlint-config", "nopeus-oxlint-plugin"]) {
      run(join(repository, "packages", name), "pnpm", [
        "pack",
        "--out",
        join(directory, name + ".tgz"),
      ]);
    }
    const root = JSON.parse(readFileSync(join(repository, "package.json"), "utf8"));
    writeFileSync(
      join(directory, "package.json"),
      JSON.stringify({
        private: true,
        type: "module",
        packageManager: root.packageManager,
        devDependencies: {
          "@adamaho/nopeus-oxlint-config": "file:./nopeus-oxlint-config.tgz",
          "@adamaho/nopeus-oxlint-plugin": "file:./nopeus-oxlint-plugin.tgz",
          oxlint: "1.79.0",
        },
      }),
    );
    run(directory, "pnpm", ["install"]);
    const packages = readdirSync(join(directory, "node_modules/.pnpm"));
    expect(
      packages.filter((name) =>
        /^(?:effect@|@effect\+|oxlint-tsgolint@|@oxlint-tsgolint\+)/u.test(name),
      ),
    ).toEqual([]);

    writeFileSync(
      join(directory, "oxlint.config.ts"),
      `
      import base from "@adamaho/nopeus-oxlint-config";
      import syntax from "@adamaho/nopeus-oxlint-plugin/base";
      export default { extends: [base, syntax] };
    `,
    );
    // Effect-specific import and state policies must not leak into the base preset.
    writeFileSync(
      join(directory, "valid.ts"),
      'import "@effect/platform";\n/** @internal */\nexport const cache = new Map();\n',
    );
    run(directory, "pnpm", ["exec", "oxlint", "--config", "oxlint.config.ts", "valid.ts"]);

    writeFileSync(
      join(directory, "invalid.ts"),
      "debugger;\n/** @internal */\nexport const value = 1 as number;\n",
    );
    const rejected = spawnSync(
      "pnpm",
      ["exec", "oxlint", "--config", "oxlint.config.ts", "--format", "json", "invalid.ts"],
      {
        cwd: directory,
        encoding: "utf8",
        timeout: 60_000,
      },
    );
    expect(rejected.error).toBeUndefined();
    expect(rejected.status, rejected.stdout + rejected.stderr).toBe(1);
    const codes = JSON.parse(rejected.stdout).diagnostics.map(
      (diagnostic: { code: string }) => diagnostic.code,
    );
    expect(codes).toContain("eslint(no-debugger)");
    expect(codes).toContain("nopeus(no-type-assertions)");

    writeFileSync(
      join(directory, "oxlint.config.ts"),
      `
      import base from "@adamaho/nopeus-oxlint-config";
      import effect from "@adamaho/nopeus-oxlint-plugin/effect";
      export default { extends: [base, effect({ packageName: "fixture" })] };
    `,
    );
    const effectOnly = spawnSync(
      "pnpm",
      ["exec", "oxlint", "--config", "oxlint.config.ts", "--format", "json", "valid.ts"],
      {
        cwd: directory,
        encoding: "utf8",
        timeout: 60_000,
      },
    );
    expect(effectOnly.error).toBeUndefined();
    expect(effectOnly.status, effectOnly.stdout + effectOnly.stderr).toBe(1);
    const effectCodes = JSON.parse(effectOnly.stdout).diagnostics.map(
      (diagnostic: { code: string }) => diagnostic.code,
    );
    expect(effectCodes).toContain("eslint(no-restricted-imports)");
    expect(effectCodes).toContain("nopeus(no-module-level-mutable-state)");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}, 240_000);
