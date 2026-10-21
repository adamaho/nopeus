import { spawnSync } from "node:child_process";
import { mkdirSync, symlinkSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "vitest";

import { testWorkspace } from "#test/helpers/workspace.ts";

const packageRoot = fileURLToPath(new URL("../../", import.meta.url));
const oxlint = join(
  dirname(fileURLToPath(import.meta.resolve("oxlint/package.json"))),
  "bin/oxlint",
);

function config(root: string, domains: string) {
  return `
    import base from "@adamaho/nopeus-oxlint-plugin/base";
    export default {
      extends: [base],
      rules: {
        "nopeus/no-cross-domain-internals": ["error", { root: ${root}, domains: ${domains} }],
      },
    };
  `;
}

test("the domain rule behaves alike from repository and package cwd and rejects invalid config", () => {
  const workspace = testWorkspace();
  try {
    workspace.write(
      "packages/app/package.json",
      JSON.stringify({ name: "@fixture/app", type: "module", imports: { "#src/*": "./src/*" } }),
    );
    // Consume the preset through its package export, as installed configs do.
    mkdirSync(workspace.file("packages/app/node_modules/@adamaho"), { recursive: true });
    symlinkSync(
      packageRoot,
      workspace.file("packages/app/node_modules/@adamaho/nopeus-oxlint-plugin"),
      "junction",
    );
    const domains = '[{ root: "src/receipts", public: ["repository.ts"] }]';
    workspace.write("packages/app/oxlint.config.ts", config("import.meta.dirname", domains));
    workspace.write("packages/app/src/receipts/repository.ts", "export const value = 1;\n");
    workspace.write("packages/app/src/receipts/sql.ts", "export const value = 1;\n");
    const files = [
      workspace.write(
        "packages/app/src/uploads/service.ts",
        'import "#src/receipts/sql.ts";\nimport "#src/receipts/repository.ts";\n',
      ),
      workspace.write("packages/app/src/main.ts", 'import "./receipts/sql.ts";\n'),
      workspace.write("packages/app/src/receipts/service.ts", 'import "./sql.ts";\n'),
      workspace.write("packages/app/test/receipts/sql.test.ts", 'import "#src/receipts/sql.ts";\n'),
    ];

    const lint = (configFile: string, cwd: string, format: string) => {
      const result = spawnSync(
        process.execPath,
        [
          oxlint,
          "--config",
          workspace.file(configFile),
          "--format",
          format,
          "--threads",
          "1",
          ...files,
        ],
        { cwd, encoding: "utf8", timeout: 60_000 },
      );
      expect(result.error).toBeUndefined();
      expect(result.status, result.stdout + result.stderr).toBe(1);
      return result;
    };

    for (const cwd of [workspace.root, workspace.file("packages/app")]) {
      const result = lint("packages/app/oxlint.config.ts", cwd, "json");
      const diagnostics = JSON.parse(result.stdout)
        .diagnostics.map(
          (diagnostic: { code: string; filename: string }) =>
            `${relative(workspace.root, resolve(cwd, diagnostic.filename)).replaceAll("\\", "/")} ${diagnostic.code}`,
        )
        .sort();
      expect(diagnostics).toEqual([
        "packages/app/src/main.ts nopeus(no-cross-domain-internals)",
        "packages/app/src/uploads/service.ts nopeus(no-cross-domain-internals)",
      ]);
    }

    // Misconfiguration fails the run instead of silently disabling a boundary.
    for (const [options, message] of [
      [
        config('"packages/app"', domains),
        'nopeus/no-cross-domain-internals: root must be the absolute directory containing the Oxlint config, such as import.meta.dirname; received "packages/app".',
      ],
      [
        config("import.meta.dirname", '[{ root: "src/receipts", public: ["repository"] }]'),
        'nopeus/no-cross-domain-internals: public module "repository" must be an existing file path relative to src/receipts.',
      ],
    ] as const) {
      workspace.write("packages/app/invalid.config.ts", options);
      const result = lint("packages/app/invalid.config.ts", workspace.root, "default");
      expect(result.stdout + result.stderr).toContain(message);
    }
  } finally {
    workspace.cleanup();
  }
}, 120_000);
