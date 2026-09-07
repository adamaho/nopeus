import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

/** Build a real two-package workspace so aliases, exports, and symlinks are exercised. */
export function testWorkspace() {
  const root = mkdtempSync(join(tmpdir(), "nopeus-structure-"));
  const write = (path: string, content: string) => {
    const filename = join(root, path);
    mkdirSync(dirname(filename), { recursive: true });
    writeFileSync(filename, content);
    return filename;
  };
  write("package.json", JSON.stringify({ name: "workspace", private: true }));
  write("packages/legacy/package.json", JSON.stringify({ name: "legacy", main: "./src/index.ts" }));
  write("packages/legacy/src/index.ts", "export const value = 1;");
  write("packages/legacy/src/internal.ts", "export const value = 1;");
  write("packages/a/package.json", JSON.stringify({ name: "@fixture/a", type: "module" }));
  write("packages/a/test/package.json", '{"type":"module"}');
  write("packages/b/src/package.json", '{"type":"module"}');
  write(
    "packages/b/package.json",
    JSON.stringify({
      name: "@fixture/b",
      type: "module",
      exports: {
        ".": "./src/index.ts",
        "./session": { types: "./src/session.ts", import: "./src/session.ts" },
        "./feature/*": "./src/features/*.ts",
        "./feature/private": null,
      },
    }),
  );
  write(
    "packages/a/tsconfig.json",
    JSON.stringify({
      compilerOptions: {
        paths: {
          "@private/*": ["../b/src/*"],
          "@tests/*": ["./test/*"],
          "@local/*": ["./src/*"],
        },
      },
    }),
  );
  for (const path of [
    "packages/a/src/main.ts",
    "packages/a/src/local.ts",
    "packages/a/test/main.test.ts",
    "packages/a/test/helpers/users.ts",
    "packages/b/src/index.ts",
    "packages/b/src/session.ts",
    "packages/b/src/internal.ts",
    "packages/b/src/features/public.ts",
    "packages/b/src/features/private.ts",
  ])
    write(path, "export const value = 1;\n");
  write("packages/a/test/fixtures/users.json", "[]");
  mkdirSync(join(root, "packages/a/node_modules/@fixture"), { recursive: true });
  symlinkSync(
    join(root, "packages/b"),
    join(root, "packages/a/node_modules/@fixture/b"),
    "junction",
  );
  symlinkSync(
    join(root, "packages/legacy"),
    join(root, "packages/a/node_modules/legacy"),
    "junction",
  );
  return {
    root,
    file: (path: string) => join(root, path),
    write,
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  };
}
