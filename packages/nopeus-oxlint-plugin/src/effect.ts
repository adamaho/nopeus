import { defineConfig } from "oxlint";

export interface NopeusEffectOptions {
  /** The consuming repository's root package name. */
  readonly packageName: string;
  /** Files that own Effect runtime execution, relative to the repository root. */
  readonly runtimeEntryPoints?: readonly string[];
}

/** Convert a root package name into its owned Effect service-key prefix. */
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
    jsPlugins: [
      {
        name: "nopeus",
        specifier: "@adamaho/nopeus-oxlint-plugin",
      },
    ],
    rules: {
      "nopeus/no-effect-runners-in-library": ["error", { allowFiles: [...runtimeEntryPoints] }],
      "nopeus/no-fallible-effect-promise": "error",
      "nopeus/no-inline-live-layer": "error",
      "nopeus/no-unscoped-fork": "error",
      "nopeus/no-untyped-effect-errors": "error",
      "nopeus/no-conditional-empty-object-spread": "error",
      "nopeus/no-known-value-widening": "error",
      "nopeus/no-module-mocking": "error",
      "nopeus/no-object-parameters": "error",
      "nopeus/no-reflect-apply": "error",
      "nopeus/no-reflect-get": "error",
      "nopeus/no-runtime-typeof": ["error", { allowInTypeGuards: true }],
      "nopeus/no-type-assertions": "error",
      "nopeus/no-unknown-returns": "error",
      "nopeus/no-unknown-type-aliases": "error",
      "nopeus/no-unsafe-dictionary-type": "error",
      "nopeus/prefer-effect-platform-services": "error",
      "nopeus/prefer-effect-void": "error",
      "nopeus/require-effect-fn-name": "error",
      "nopeus/require-public-jsdoc": "error",
      "nopeus/require-service-key-prefix": [
        "error",
        { prefix: serviceKeyPrefixFromPackageName(packageName) },
      ],
      "nopeus/require-service-make-layer": "error",
    },
  });
}
