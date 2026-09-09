import { defineConfig } from "oxlint";

import base from "./base.ts";

export interface NopeusEffectOptions {
  /** The consuming repository's root package name. */
  readonly packageName: string;
  /** Files that own Effect runtime execution, relative to the repository root. */
  readonly runtimeEntryPoints?: readonly string[];
}

/** Convert a root package name into its owned Effect identifier prefix. */
export function serviceKeyPrefixFromPackageName(packageName: string): string {
  const projectName = packageName.split("/").at(-1);
  if (projectName === undefined || projectName.length === 0) {
    throw new TypeError("packageName must contain a project name");
  }

  return "@" + projectName + "/";
}

/** Build the canonical Nopeus policy for an Effect repository. */
export default function effect({ packageName, runtimeEntryPoints = [] }: NopeusEffectOptions) {
  return defineConfig({
    ...base,
    rules: {
      ...base.rules,
      "eslint/no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@effect/platform",
              message:
                "Use Effect v4 consolidated modules from `effect` (for example `effect/unstable/httpapi` or `effect/unstable/http`).",
            },
            {
              name: "@effect/sql",
              message:
                "Use `effect/unstable/sql` and driver-specific `@effect/sql-*` packages in Effect v4.",
            },
            {
              name: "@effect/rpc",
              message: "Use `effect/unstable/rpc` in Effect v4.",
            },
            {
              name: "@effect/cluster",
              message: "Use `effect/unstable/cluster` in Effect v4.",
            },
          ],
          patterns: [
            {
              group: ["@effect/platform/*", "@effect/sql/*", "@effect/rpc/*", "@effect/cluster/*"],
              message:
                "Do not import v3 split Effect packages. Use consolidated `effect` module imports in v4.",
            },
          ],
        },
      ],
      "nopeus/no-module-level-mutable-state": "error",
      "nopeus/require-fetch-abort-signal": "error",
      "nopeus/no-effect-runners-in-library": ["error", { allowFiles: [...runtimeEntryPoints] }],
      "nopeus/no-fallible-effect-promise": "error",
      "nopeus/no-inline-live-layer": "error",
      "nopeus/no-unscoped-fork": "error",
      "nopeus/no-untyped-effect-errors": "error",
      "nopeus/prefer-effect-platform-services": "error",
      "nopeus/prefer-effect-void": "error",
      "nopeus/require-effect-fn-name": "error",
      "nopeus/require-effect-namespace": [
        "error",
        { prefix: serviceKeyPrefixFromPackageName(packageName) },
      ],
      "nopeus/require-service-constructor-names": "error",
    },
  });
}
