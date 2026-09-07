import base from "./base.ts";
import effect, { type NopeusEffectOptions } from "./effect.ts";
import plugin from "./index.ts";

const files = ["**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}"];
type Rules = Readonly<Record<string, "error" | readonly unknown[]>>;

export interface NopeusEslintOptions {
  /** An ESLint parser that supports the consuming project's syntax. */
  readonly parser: object;
}

function rulesForEslint(rules: Rules) {
  return Object.fromEntries(
    Object.entries(rules).map(([name, configuration]) => [
      name === "eslint/no-restricted-imports" ? "no-restricted-imports" : name,
      configuration,
    ]),
  );
}

function config(parser: object, rules: Rules) {
  return {
    files,
    languageOptions: {
      parser,
      parserOptions: { ecmaVersion: "latest" as const, sourceType: "module" as const },
    },
    plugins: { nopeus: plugin },
    rules: rulesForEslint(rules),
  };
}

/** Build the general Nopeus syntax policy for ESLint without Oxlint raw transfer. */
export function eslintBase({ parser }: NopeusEslintOptions) {
  return [config(parser, base.rules)];
}

/** Build the Effect syntax policy for ESLint without Oxlint raw transfer. */
export function eslintEffect({ parser, ...options }: NopeusEslintOptions & NopeusEffectOptions) {
  return [config(parser, effect(options).rules)];
}
