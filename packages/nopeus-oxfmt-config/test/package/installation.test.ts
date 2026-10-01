import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "vitest";

const packageDirectory = fileURLToPath(new URL("../../", import.meta.url));
const repository = fileURLToPath(new URL("../../../../", import.meta.url));

function run(cwd: string, command: string, args: readonly string[]) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8", timeout: 120_000 });
  expect(result.error).toBeUndefined();
  expect(result.status, result.stdout + result.stderr).toBe(0);
  return result.stdout;
}

test("published config formats with both exports and supports consumer overrides and ignores", () => {
  const directory = mkdtempSync(join(tmpdir(), "nopeus-oxfmt-package-"));
  try {
    run(packageDirectory, "pnpm", ["pack", "--out", join(directory, "config.tgz")]);
    const root = JSON.parse(readFileSync(join(repository, "package.json"), "utf8"));
    const typescript = JSON.parse(
      readFileSync(join(packageDirectory, "node_modules/typescript/package.json"), "utf8"),
    );
    writeFileSync(
      join(directory, "package.json"),
      JSON.stringify({
        private: true,
        type: "module",
        packageManager: root.packageManager,
        devDependencies: {
          "@adamaho/nopeus-oxfmt-config": "file:./config.tgz",
          oxfmt: "0.71.0",
          typescript: typescript.version,
        },
      }),
    );
    run(directory, "pnpm", ["install", "--strict-peer-dependencies"]);

    const input = 'import z from "z";\nimport a from "a";\nexport const value={z,a}';
    const expected = 'import a from "a";\nimport z from "z";\nexport const value = { z, a };\n';
    for (const entry of ["@adamaho/nopeus-oxfmt-config", "@adamaho/nopeus-oxfmt-config/base"]) {
      writeFileSync(
        join(directory, "oxfmt.config.ts"),
        `import base from "${entry}";\nexport default base;\n`,
      );
      writeFileSync(join(directory, "example.ts"), input);
      run(directory, "pnpm", ["exec", "oxfmt", "example.ts"]);
      expect(readFileSync(join(directory, "example.ts"), "utf8")).toBe(expected);
      run(directory, "pnpm", [
        "exec",
        "tsc",
        "--noEmit",
        "--strict",
        "--module",
        "nodenext",
        "--skipLibCheck",
        "oxfmt.config.ts",
      ]);
    }

    writeFileSync(
      join(directory, "oxfmt.config.ts"),
      `import base from "@adamaho/nopeus-oxfmt-config";
import { defineConfig } from "oxfmt";
export default defineConfig({
  ...base,
  singleQuote: true,
  ignorePatterns: ["ignored.ts"],
});
`,
    );
    writeFileSync(join(directory, "ignored.ts"), "const intentionallyInvalid = ;\n");
    run(directory, "pnpm", ["exec", "oxfmt", "example.ts", "ignored.ts"]);
    expect(readFileSync(join(directory, "example.ts"), "utf8")).toBe(expected.replaceAll('"', "'"));
    expect(readFileSync(join(directory, "ignored.ts"), "utf8")).toBe(
      "const intentionallyInvalid = ;\n",
    );
    run(directory, "pnpm", ["exec", "oxfmt", "--check", "example.ts", "ignored.ts"]);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}, 240_000);
