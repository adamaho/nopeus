import { existsSync, readFileSync, realpathSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

/** A package boundary ignores manifests that only select a module format. */
export interface PackageOwner {
  readonly root: string;
  readonly name: string | null;
  readonly hasExports: boolean;
}

/** Normalize existing symlinks without requiring editor buffers to exist on disk. */
export function physicalPath(filename: string): string {
  const absolute = resolve(filename);
  return existsSync(absolute) ? realpathSync(absolute) : absolute;
}

/** Find the package that owns a source file or an unsaved editor buffer. */
export function packageOwner(filename: string): PackageOwner | null {
  let directory = dirname(physicalPath(filename));
  while (true) {
    const manifest = join(directory, "package.json");
    if (existsSync(manifest)) {
      const value = JSON.parse(readFileSync(manifest, "utf8"));
      // Distribution folders often use { "type": "module" } (or commonjs)
      // without defining a new package or public API.
      if (
        !(
          (value?.type === "module" || value?.type === "commonjs") &&
          Object.keys(value).length === 1
        )
      ) {
        return {
          root: directory,
          name: typeof value?.name === "string" ? value.name : null,
          hasExports: value !== null && Object.hasOwn(value, "exports"),
        };
      }
    }
    const parent = dirname(directory);
    if (parent === directory) return null;
    directory = parent;
  }
}

/** Return a portable package-relative path, including for Windows hosts. */
export function packagePath(owner: PackageOwner, filename: string): string {
  return relative(owner.root, physicalPath(filename)).split(sep).join("/");
}

/** Recognize test/spec suffixes on supported JavaScript and TypeScript files. */
export function isTestFile(filename: string): boolean {
  return /\.(?:test|spec)\.(?:[cm]?[jt]s|[jt]sx)$/u.test(filename);
}

/** Include test resources and legacy test locations in the production boundary. */
export function isTestPath(path: string): boolean {
  return (
    path.startsWith("test/") ||
    path.startsWith("tests/") ||
    path.split("/").includes("__tests__") ||
    isTestFile(path)
  );
}
