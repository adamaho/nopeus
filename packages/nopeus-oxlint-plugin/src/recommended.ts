import { defineConfig } from "oxlint";

export interface RecommendedOptions {
  /** The consuming repository's root package name. */
  readonly packageName: string;
}

/** Convert a root package name into its owned Effect service-key prefix. */
export function serviceKeyPrefixFromPackageName(packageName: string): string {
  const projectName = packageName.split("/").at(-1);
  if (projectName === undefined || projectName.length === 0) {
    throw new TypeError("packageName must contain a project name");
  }

  return `@${projectName}/`;
}

/** Build the strict shared policy for a consuming repository. */
export default function recommended({ packageName }: RecommendedOptions) {
  return defineConfig({
    jsPlugins: [
      {
        name: "nopeus",
        specifier: "@adamaho/nopeus-oxlint-plugin",
      },
    ],
    rules: {
      "nopeus/no-chained-type-assertions": "error",
      "nopeus/no-known-value-widening": "error",
      "nopeus/no-module-mocking": "error",
      "nopeus/no-object-parameters": "error",
      "nopeus/no-reflect-apply": "error",
      "nopeus/no-reflect-get": "error",
      "nopeus/no-service-constructor-imports": "error",
      "nopeus/no-unknown-parameters": "error",
      "nopeus/no-unknown-returns": "error",
      "nopeus/no-unknown-type-aliases": "error",
      "nopeus/no-unsafe-dictionary-type": "error",
      "nopeus/no-widen-then-assert": "error",
      "nopeus/require-effect-fn-name": "error",
      "nopeus/require-service-key-prefix": [
        "error",
        { prefix: serviceKeyPrefixFromPackageName(packageName) },
      ],
      "nopeus/require-safety-comment-for-type-assertion": "error",
    },
    overrides: [
      {
        files: ["**/*.{test,spec}.{js,jsx,ts,tsx}"],
        rules: {
          "nopeus/no-chained-type-assertions": "off",
          "nopeus/no-known-value-widening": "off",
          "nopeus/no-object-parameters": "off",
          "nopeus/no-unknown-type-aliases": "off",
          "nopeus/no-unsafe-dictionary-type": "off",
          "nopeus/no-widen-then-assert": "off",
          "nopeus/require-safety-comment-for-type-assertion": "off",
        },
      },
    ],
  });
}
