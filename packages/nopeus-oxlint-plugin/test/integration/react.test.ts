import { spawnSync } from "node:child_process";
import { mkdirSync, symlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "vitest";

import { testWorkspace } from "#test/helpers/workspace.ts";

const packageRoot = fileURLToPath(new URL("../../", import.meta.url));
const oxlint = join(
  dirname(fileURLToPath(import.meta.resolve("oxlint/package.json"))),
  "bin/oxlint",
);

function config(react: string, domains: string) {
  return `
    import react from "@adamaho/nopeus-oxlint-plugin/react";
    export default {
      extends: [react({ root: import.meta.dirname, ${react} })],
      rules: {
        "nopeus/no-cross-domain-internals": ["error", { root: import.meta.dirname, domains: ${domains} }],
      },
    };
  `;
}

test("the React preset and domain rule behave alike from repository and package cwd", () => {
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
    const domains = '[{ root: "src/features/receipts", public: ["repository.ts"] }]';
    workspace.write(
      "packages/app/oxlint.config.ts",
      config('files: ["src/**", "test/**"], transports: ["src/transport/**"]', domains),
    );
    workspace.write(
      "packages/app/src/features/receipts/repository.ts",
      "export const value = 1;\n",
    );
    workspace.write("packages/app/src/features/receipts/sql.ts", "export const value = 1;\n");
    const invalid = workspace.write(
      "packages/app/src/features/uploads/upload-panel.tsx",
      'import "react-router"; import "#src/features/receipts/sql.ts";\nfetch("/a"); globalThis.fetch("/b"); self.fetch("/c");\n',
    );
    const valid = [
      workspace.write(
        "packages/app/src/transport/http.ts",
        'fetch("/a"); globalThis.fetch("/b");\n',
      ),
      workspace.write("packages/app/test/setup.ts", 'import "react-router"; fetch("/a");\n'),
      workspace.write(
        "packages/app/src/features/uploads/upload.ts",
        'import "#src/features/receipts/repository.ts";\nfunction load(fetch: () => void, window: { fetch(): void }) { fetch(); window.fetch(); }\nload(() => {}, { fetch() {} });\n',
      ),
    ];
    const outcomes = [workspace.root, workspace.file("packages/app")].map((cwd) => {
      const result = spawnSync(
        process.execPath,
        [
          oxlint,
          "--config",
          workspace.file("packages/app/oxlint.config.ts"),
          "--format",
          "json",
          "--threads",
          "1",
          invalid,
          ...valid,
        ],
        { cwd, encoding: "utf8", timeout: 60_000 },
      );
      expect(result.error).toBeUndefined();
      expect(result.status, result.stdout + result.stderr).toBe(1);
      return JSON.parse(result.stdout)
        .diagnostics.map((diagnostic: { code: string; filename: string }) => {
          expect(diagnostic.filename).toContain("upload-panel.tsx");
          return diagnostic.code;
        })
        .sort();
    });
    expect(outcomes[0]).toEqual([
      "eslint(no-restricted-globals)",
      "eslint(no-restricted-globals)",
      "eslint(no-restricted-globals)",
      "nopeus(no-cross-domain-internals)",
      "nopeus(no-react-layer-imports)",
    ]);
    expect(outcomes[1]).toEqual(outcomes[0]);

    // Misconfiguration fails the run instead of silently disabling a boundary.
    for (const [options, message] of [
      [
        config('transports: ["/src/transport/**"]', domains),
        'react: transports patterns are relative to the config root; received "/src/transport/**".',
      ],
      [
        config('routes: ["/src/routes/**"]', domains),
        'nopeus/no-react-layer-imports: routes patterns are relative to the config root; received "/src/routes/**".',
      ],
      [
        config("", domains).replace("import.meta.dirname, domains", '"packages/app", domains'),
        'nopeus/no-cross-domain-internals: root must be the absolute directory containing the Oxlint config, such as import.meta.dirname; received "packages/app".',
      ],
      [
        config("", '[{ root: "src/features/receipts", public: ["repository"] }]'),
        'nopeus/no-cross-domain-internals: public module "repository" must be an existing file path relative to src/features/receipts.',
      ],
    ] as const) {
      workspace.write("packages/app/invalid.config.ts", options);
      const result = spawnSync(
        process.execPath,
        [
          oxlint,
          "--config",
          workspace.file("packages/app/invalid.config.ts"),
          "--threads",
          "1",
          invalid,
        ],
        { cwd: workspace.root, encoding: "utf8", timeout: 60_000 },
      );
      expect(result.error).toBeUndefined();
      expect(result.status, result.stdout + result.stderr).toBe(1);
      expect(result.stdout + result.stderr).toContain(message);
    }
  } finally {
    workspace.cleanup();
  }
}, 120_000);
