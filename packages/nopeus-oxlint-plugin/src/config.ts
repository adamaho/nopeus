import { defineConfig } from "oxlint";

export interface NopeusOptions {
  /** The consuming repository's root package name. */
  readonly packageName: string;
}

/** Convert a root package name into its owned Effect service-key prefix. */
export function serviceKeyPrefixFromPackageName(packageName: string): string {
  const projectName = packageName.split("/").at(-1);
  if (projectName === undefined || projectName.length === 0) {
    throw new TypeError("packageName must contain a project name");
  }

  return "@" + projectName + "/";
}

/** Build the canonical Nopeus policy for a consuming repository. */
export default function nopeus({ packageName }: NopeusOptions) {
  return defineConfig({
    jsPlugins: [
      {
        name: "nopeus",
        specifier: "@adamaho/nopeus-oxlint-plugin",
      },
    ],
    rules: {
      "nopeus/no-chained-type-assertions": "error",
      "nopeus/no-conditional-empty-object-spread": "error",
      "nopeus/no-known-value-widening": "error",
      "nopeus/no-module-mocking": "error",
      "nopeus/no-object-parameters": "error",
      "nopeus/no-reflect-apply": "error",
      "nopeus/no-reflect-get": "error",
      "nopeus/no-runtime-typeof": ["error", { allowInTypeGuards: true }],
      "nopeus/no-unknown-returns": "error",
      "nopeus/no-unknown-type-aliases": "error",
      "nopeus/no-unsafe-dictionary-type": "error",
      "nopeus/no-widen-then-assert": "error",
      "nopeus/require-effect-fn-name": "error",
      "nopeus/require-safety-comment-for-type-assertion": "error",
      "nopeus/require-service-key-prefix": [
        "error",
        { prefix: serviceKeyPrefixFromPackageName(packageName) },
      ],
    },
  });
}
