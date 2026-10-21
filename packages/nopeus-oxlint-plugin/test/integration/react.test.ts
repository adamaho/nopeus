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

function config(react: string, domains: string) {
  return `
    import react from "@adamaho/nopeus-oxlint-plugin/react";
    export default {
      extends: [react({ root: import.meta.dirname, ${react} })],
      rules: {
        "eslint/no-debugger": "error",
        "nopeus/no-cross-domain-internals": ["error", { root: import.meta.dirname, domains: ${domains} }],
      },
    };
  `;
}

type Workspace = ReturnType<typeof testWorkspace>;

// Consume the preset through its package export, as installed configs do.
function installPlugin(workspace: Workspace, directory: string) {
  mkdirSync(workspace.file(join(directory, "node_modules/@adamaho")), { recursive: true });
  symlinkSync(
    packageRoot,
    workspace.file(join(directory, "node_modules/@adamaho/nopeus-oxlint-plugin")),
    "junction",
  );
}

function lint(
  workspace: Workspace,
  configFile: string,
  cwd: string,
  files: readonly string[],
  format = "json",
) {
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
  return {
    output: result.stdout + result.stderr,
    status: result.status,
    diagnostics: (): string[] =>
      JSON.parse(result.stdout)
        .diagnostics.map(
          (diagnostic: { code: string; filename: string }) =>
            `${relative(workspace.root, resolve(cwd, diagnostic.filename)).replaceAll("\\", "/")} ${diagnostic.code}`,
        )
        .sort(),
  };
}

test("the React preset and domain rule behave alike from repository and package cwd", () => {
  const workspace = testWorkspace();
  try {
    workspace.write(
      "packages/app/package.json",
      JSON.stringify({ name: "@fixture/app", type: "module", imports: { "#src/*": "./src/*" } }),
    );
    installPlugin(workspace, "packages/app");
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
    const invalid = [
      workspace.write(
        "packages/app/src/features/uploads/upload-panel.tsx",
        'import "react-router"; import "#src/features/receipts/sql.ts";\nfetch("/a"); globalThis.fetch("/b"); self.fetch("/c");\n',
      ),
      // A production folder named test is not test setup.
      workspace.write("packages/app/src/routes/test/results.tsx", 'fetch("/");\n'),
    ];
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
      const result = lint(workspace, "packages/app/oxlint.config.ts", cwd, [...invalid, ...valid]);
      expect(result.status, result.output).toBe(1);
      return result.diagnostics();
    });
    const panel = "packages/app/src/features/uploads/upload-panel.tsx";
    expect(outcomes[0]).toEqual([
      `${panel} eslint(no-restricted-globals)`,
      `${panel} eslint(no-restricted-globals)`,
      `${panel} eslint(no-restricted-globals)`,
      `${panel} nopeus(no-cross-domain-internals)`,
      `${panel} nopeus(no-react-layer-imports)`,
      "packages/app/src/routes/test/results.tsx eslint(no-restricted-globals)",
    ]);
    expect(outcomes[1]).toEqual(outcomes[0]);

    // Misconfiguration fails the run instead of silently disabling a boundary.
    const unsupported = "patterns must be positive globs relative to the config root";
    for (const [options, message] of [
      [
        config('transports: ["/src/transport/**"]', domains),
        `react: transports ${unsupported}, without ".." segments; received "/src/transport/**".`,
      ],
      [
        config('files: ["!src/**"]', domains),
        `react: files ${unsupported}, without ".." segments; received "!src/**".`,
      ],
      [
        config('files: ["./!src/**"]', domains),
        `react: files ${unsupported}, without ".." segments; received "./!src/**".`,
      ],
      [
        config('files: [".//src/**"]', domains),
        `react: files ${unsupported}, without ".." segments; received ".//src/**".`,
      ],
      [
        config('data: ["../app/src/data/**"]', domains),
        `nopeus/no-react-layer-imports: data ${unsupported}, without ".." segments; received "../app/src/data/**".`,
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
      const result = lint(
        workspace,
        "packages/app/invalid.config.ts",
        workspace.root,
        invalid,
        "default",
      );
      expect(result.status, result.output).toBe(1);
      expect(result.output).toContain(message);
    }
  } finally {
    workspace.cleanup();
  }
}, 120_000);

test("shorthand, ./ and fetch test patterns select the same files for both checks", () => {
  const workspace = testWorkspace();
  try {
    installPlugin(workspace, ".");
    workspace.write("packages/app/package.json", JSON.stringify({ name: "@fixture/app" }));
    workspace.write("packages/app/src/store/items.ts", "export const items = [];\n");
    const files = [
      workspace.write("packages/app/src/view.tsx", 'import "./store/items.ts";\nfetch("/");\n'),
      workspace.write("packages/app/src/routes/test/results.tsx", 'fetch("/");\n'),
      // Package test setup may use fetch; ordinary rules still run there.
      workspace.write("packages/app/test/setup.tsx", 'fetch("/");\ndebugger;\n'),
    ];
    const outcomes = ['"*.tsx"', '"./packages/**"'].map((governed) => {
      workspace.write(
        "oxlint.config.ts",
        config(
          `files: [${governed}], data: ["./packages/app/src/store/**"], fetchTestFiles: ["packages/*/test/**"]`,
          '[{ root: "packages/app", public: [] }]',
        ),
      );
      const result = lint(workspace, "oxlint.config.ts", workspace.root, files);
      expect(result.status, result.output).toBe(1);
      return result.diagnostics();
    });
    expect(outcomes[0]).toEqual([
      "packages/app/src/routes/test/results.tsx eslint(no-restricted-globals)",
      "packages/app/src/view.tsx eslint(no-restricted-globals)",
      "packages/app/src/view.tsx nopeus(no-react-layer-imports)",
      "packages/app/test/setup.tsx eslint(no-debugger)",
    ]);
    expect(outcomes[1]).toEqual(outcomes[0]);
  } finally {
    workspace.cleanup();
  }
}, 120_000);
