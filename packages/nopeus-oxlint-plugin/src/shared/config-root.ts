import { statSync } from "node:fs";
import { isAbsolute, posix, relative, sep } from "node:path";

import type { Options } from "@oxlint/plugins";

import { isTestPath, packageOwner, packagePath, physicalPath } from "./package-layout.ts";

export type OptionValue = Options[number];

/** Read a schema-validated object option without type assertions. */
export function optionObject(
  value: OptionValue | undefined,
): Readonly<Record<string, OptionValue>> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value : {};
}

/** Read a schema-validated string list without type assertions. */
export function stringList(value: OptionValue | undefined): readonly string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

/** Report whether a path is the parent itself or lies beneath it. */
export function isWithin(parent: string, path: string): boolean {
  const child = relative(parent, path);
  return child !== ".." && !child.startsWith(".." + sep) && !isAbsolute(child);
}

export function isDirectory(path: string): boolean {
  return statSync(path, { throwIfNoEntry: false })?.isDirectory() === true;
}

/**
 * Resolve the explicit config directory. Oxlint's cwd differs between repository
 * and package runs, so path options never depend on it.
 */
export function configRoot(rule: string, root: OptionValue | undefined): string {
  if (typeof root !== "string" || !isAbsolute(root) || !isDirectory(root)) {
    throw new TypeError(
      `${rule}: root must be the absolute directory containing the Oxlint config, such as import.meta.dirname; received ${JSON.stringify(root)}.`,
    );
  }
  return physicalPath(root);
}

/** Reject absolute globs, which would otherwise silently match nothing. */
export function relativePatterns(rule: string, name: string, patterns: readonly string[]) {
  const absolute = patterns.find((pattern) => isAbsolute(pattern));
  if (absolute !== undefined) {
    throw new TypeError(
      `${rule}: ${name} patterns are relative to the config root; received ${JSON.stringify(absolute)}.`,
    );
  }
  return patterns;
}

/** Return a portable root-relative path, or null for files outside the root. */
export function rootPath(root: string, filename: string): string | null {
  return isWithin(root, filename) ? relative(root, filename).split(sep).join("/") : null;
}

export function matchesAny(path: string, patterns: readonly string[]): boolean {
  return patterns.some((pattern) => posix.matchesGlob(path, pattern));
}

/** Return the package owner of a test or test resource, which keeps internal access. */
export function testPackage(filename: string): string | null {
  const owner = packageOwner(filename);
  return owner && isTestPath(packagePath(owner, filename)) ? owner.root : null;
}
