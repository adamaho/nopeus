import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "vitest";

const repository = fileURLToPath(new URL("../../../../", import.meta.url));

function run(cwd: string, command: string, args: readonly string[]) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8", timeout: 120_000 });
  expect(result.error).toBeUndefined();
  expect(result.status, result.stdout + result.stderr).toBe(0);
  return result.stdout;
}

test("published base presets install and lint without Effect packages", () => {
  const directory = mkdtempSync(join(tmpdir(), "nopeus-package-"));
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
        imports: { "#local": "./local.ts" },
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
        /^(?:effect@|@effect\+|oxlint-tsgolint@|@oxlint-tsgolint\+|react@|react-|@tanstack\+|swr@)/u.test(
          name,
        ),
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
    writeFileSync(join(directory, "local.ts"), "export const value = 1;\n");
    writeFileSync(
      join(directory, "valid.ts"),
      'import "@effect/platform"; import "#local"; import "./local.ts";\n/** @internal */\nexport const cache = new Map();\n',
    );
    run(directory, "pnpm", ["exec", "oxlint", "--config", "oxlint.config.ts", "valid.ts"]);

    writeFileSync(
      join(directory, "invalid.ts"),
      "debugger;\nconst value = 1 as number;\n" +
        'require("node:fs"); module.exports = {}; export = value;\nimport "../local.ts";\n',
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
    expect(codes).toContain("typescript(no-require-imports)");
    expect(codes).toContain("import(no-commonjs)");
    expect(codes).toContain("import(no-relative-parent-imports)");
    expect(codes).toContain("nopeus(no-export-assignment)");

    writeFileSync(join(directory, "Misplaced.test.ts"), "export {};\n");
    const structure = spawnSync(
      "pnpm",
      ["exec", "oxlint", "--config", "oxlint.config.ts", "--format", "json", "Misplaced.test.ts"],
      { cwd: directory, encoding: "utf8", timeout: 60_000 },
    );
    expect(structure.error).toBeUndefined();
    expect(structure.status, structure.stdout + structure.stderr).toBe(1);
    const structureCodes = JSON.parse(structure.stdout).diagnostics.map(
      (diagnostic: { code: string }) => diagnostic.code,
    );
    expect(structureCodes).toContain("unicorn(filename-case)");
    expect(structureCodes).toContain("nopeus(require-test-location)");

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

    // The opt-in React preset ships types and composes with base and Effect policies.
    writeFileSync(
      join(directory, "types.ts"),
      'import react, { type NopeusReactOptions } from "@adamaho/nopeus-oxlint-plugin/react";\n' +
        'const options: NopeusReactOptions = { root: "/repo", transports: ["src/transport/**"] };\n' +
        "export const config = react(options);\n",
    );
    writeFileSync(
      join(directory, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: { module: "nodenext", strict: true, noEmit: true, types: [] },
        files: ["types.ts"],
      }),
    );
    run(directory, process.execPath, [
      fileURLToPath(new URL("bin/tsc", import.meta.resolve("typescript/package.json"))),
      "-p",
      "tsconfig.json",
    ]);
    writeFileSync(
      join(directory, "oxlint.config.ts"),
      `
      import base from "@adamaho/nopeus-oxlint-config";
      import effect from "@adamaho/nopeus-oxlint-plugin/effect";
      import react from "@adamaho/nopeus-oxlint-plugin/react";
      export default {
        extends: [
          base,
          effect({ packageName: "fixture" }),
          react({ root: import.meta.dirname, transports: ["src/transport/**"] }),
        ],
      };
    `,
    );
    mkdirSync(join(directory, "src/transport"), { recursive: true });
    writeFileSync(join(directory, "src/transport/http.ts"), 'void fetch("/a");\n');
    writeFileSync(
      join(directory, "src/visual.tsx"),
      'import "react-router";\nvoid globalThis.fetch("/a");\nvoid self.fetch("/b");\n',
    );
    // Preset override globs stay relative to the consuming config across cwd.
    for (const cwd of [directory, join(directory, "src")]) {
      const composed = spawnSync(
        "pnpm",
        [
          "exec",
          "oxlint",
          "--config",
          join(directory, "oxlint.config.ts"),
          "--format",
          "json",
          join(directory, "valid.ts"),
          join(directory, "src/visual.tsx"),
          join(directory, "src/transport/http.ts"),
        ],
        { cwd, encoding: "utf8", timeout: 60_000 },
      );
      expect(composed.error).toBeUndefined();
      expect(composed.status, composed.stdout + composed.stderr).toBe(1);
      const diagnostics: readonly { code: string; filename: string }[] = JSON.parse(
        composed.stdout,
      ).diagnostics;
      const codes = (file: string) =>
        diagnostics
          .filter((diagnostic) => diagnostic.filename.endsWith(file))
          .map((diagnostic) => diagnostic.code);
      expect(codes("valid.ts")).toContain("eslint(no-restricted-imports)");
      expect(codes("valid.ts")).toContain("nopeus(no-module-level-mutable-state)");
      expect(codes("visual.tsx")).toContain("nopeus(no-react-layer-imports)");
      expect(
        codes("visual.tsx").filter((code) => code === "eslint(no-restricted-globals)"),
      ).toHaveLength(2);
      expect(codes("http.ts")).not.toContain("eslint(no-restricted-globals)");
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}, 240_000);
