import { statSync } from "node:fs";
import { isAbsolute, relative, sep } from "node:path";

import type { Options } from "@oxlint/plugins";
import { minimatch } from "minimatch";

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

/**
 * Normalize globs to match Oxlint overrides: drop a leading `./`, and match
 * slash-free patterns such as `*.tsx` at any depth. Reject absolute, parent and
 * negated patterns, which would otherwise silently match nothing or differ.
 */
export function rootPatterns(rule: string, name: string, patterns: readonly string[]) {
  return patterns.map((pattern) => {
    // Validate after normalizing so `./!src/**` or `.//src/**` cannot slip through.
    const path = pattern.replace(/^(?:\.\/)+/u, "");
    if (isAbsolute(path) || path.startsWith("!") || path.split("/").includes("..")) {
      throw new TypeError(
        `${rule}: ${name} patterns must be positive globs relative to the config root, without ".." segments; received ${JSON.stringify(pattern)}.`,
      );
    }
    return path.includes("/") ? path : "**/" + path;
  });
}

/** Return a portable root-relative path, or null for files outside the root. */
export function rootPath(root: string, filename: string): string | null {
  return isWithin(root, filename) ? relative(root, filename).split(sep).join("/") : null;
}

/**
 * Match like Oxlint overrides, so the rule and the preset's fetch override select
 * the same files: `*` and `**` include dot-prefixed names, and extglobs such as
 * `+(a|b)` are literal. Node's `matchesGlob` exposes neither option.
 */
export function matchesAny(path: string, patterns: readonly string[]): boolean {
  return patterns.some((pattern) => minimatch(path, pattern, { dot: true, noext: true }));
}

/** Return the package owner of a test or test resource, which keeps internal access. */
export function testPackage(filename: string): string | null {
  const owner = packageOwner(filename);
  return owner && isTestPath(packagePath(owner, filename)) ? owner.root : null;
}
