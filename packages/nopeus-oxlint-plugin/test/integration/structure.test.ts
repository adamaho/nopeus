import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "vitest";

import { testWorkspace } from "../helpers/workspace.ts";

const packageRoot = fileURLToPath(new URL("../../", import.meta.url));
const oxlint = join(
  dirname(fileURLToPath(import.meta.resolve("oxlint/package.json"))),
  "bin/oxlint",
);

test("structure checks use package ownership from both repository and package cwd", () => {
  const workspace = testWorkspace();
  try {
    workspace.write(
      "oxlint.json",
      JSON.stringify({
        plugins: ["unicorn"],
        jsPlugins: [{ name: "nopeus", specifier: join(packageRoot, "src/index.ts") }],
        rules: {
          "unicorn/filename-case": ["error", { case: "kebabCase" }],
          "nopeus/no-cross-package-internals": "error",
          "nopeus/no-test-imports": "error",
          "nopeus/require-test-location": "error",
        },
      }),
    );
    const valid = workspace.write(
      "packages/a/test/users.test.ts",
      'import "../src/local.ts"; import "@fixture/b/session";',
    );
    const invalid = workspace.write(
      "packages/a/src/invalid.ts",
      'import "@private/internal"; import "@tests/helpers/users";',
    );
    const misplaced = workspace.write("packages/a/src/misplaced.test.ts", "export {};");
    const casing = workspace.write("packages/a/src/BadName.ts", "export {};");
    for (const cwd of [workspace.root, workspace.file("packages/a")]) {
      const run = (files: string[]) =>
        spawnSync(
          process.execPath,
          [
            oxlint,
            "--config",
            workspace.file("oxlint.json"),
            "--format",
            "json",
            "--threads",
            "1",
            ...files,
          ],
          { cwd, encoding: "utf8", timeout: 60_000 },
        );
      const accepted = run([valid]);
      expect(accepted.error).toBeUndefined();
      expect(accepted.status, accepted.stdout + accepted.stderr).toBe(0);
      const rejected = run([invalid, valid, misplaced, casing]);
      expect(rejected.error).toBeUndefined();
      expect(rejected.status, rejected.stdout + rejected.stderr).toBe(1);
      const { diagnostics } = JSON.parse(rejected.stdout);
      for (const rule of [
        "no-cross-package-internals",
        "no-test-imports",
        "require-test-location",
        "filename-case",
      ]) {
        expect(diagnostics).toContainEqual(
          expect.objectContaining({ code: expect.stringContaining(rule) }),
        );
      }
      expect(diagnostics).toHaveLength(4);
    }
  } finally {
    workspace.cleanup();
  }
}, 120_000);

test("the syntax policy rejects CommonJS in source and tests", () => {
  const workspace = testWorkspace();
  try {
    const config = join(packageRoot, "oxlint.config.ts");
    for (const [code, rule] of [
      ['require("node:fs");', "no-require-imports"],
      ['if (flag) { require("node:fs"); }', "no-require-imports"],
      ['import fs = require("node:fs");', "no-require-imports"],
      ["module.exports = {};", "no-commonjs"],
      ["exports.value = 1;", "no-commonjs"],
      ["const value = 1; export = value;", "no-export-assignment"],
    ] as const) {
      for (const path of ["packages/a/src/common.cts", "packages/a/test/common.test.ts"]) {
        const filename = workspace.write(path, code);
        const result = spawnSync(
          process.execPath,
          [oxlint, "--config", config, "--format", "json", "--threads", "1", filename],
          { cwd: workspace.root, encoding: "utf8", timeout: 60_000 },
        );
        expect(result.error).toBeUndefined();
        expect(result.status, code + "\n" + result.stdout + result.stderr).toBe(1);
        expect(JSON.parse(result.stdout).diagnostics).toContainEqual(
          expect.objectContaining({ code: expect.stringContaining(rule) }),
        );
      }
    }
  } finally {
    workspace.cleanup();
  }
}, 120_000);
