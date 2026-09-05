import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repository = fileURLToPath(new URL("../../../", import.meta.url));

function run(cwd, command, args) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8", timeout: 120_000 });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  return result.stdout;
}

test(
  "published base presets install and lint without Effect packages",
  { timeout: 240_000 },
  () => {
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
      assert.deepEqual(
        packages.filter((name) =>
          /^(?:effect@|@effect\+|oxlint-tsgolint@|@oxlint-tsgolint\+)/u.test(name),
        ),
        [],
      );

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
      assert.ifError(rejected.error);
      assert.equal(rejected.status, 1, rejected.stdout + rejected.stderr);
      const codes = JSON.parse(rejected.stdout).diagnostics.map((diagnostic) => diagnostic.code);
      assert.ok(codes.includes("eslint(no-debugger)"));
      assert.ok(codes.includes("nopeus(no-type-assertions)"));

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
      assert.ifError(effectOnly.error);
      assert.equal(effectOnly.status, 1, effectOnly.stdout + effectOnly.stderr);
      const effectCodes = JSON.parse(effectOnly.stdout).diagnostics.map(
        (diagnostic) => diagnostic.code,
      );
      assert.ok(effectCodes.includes("eslint(no-restricted-imports)"));
      assert.ok(effectCodes.includes("nopeus(no-module-level-mutable-state)"));
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  },
);
