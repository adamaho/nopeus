import { expect, test } from "vitest";

import effect, { serviceKeyPrefixFromPackageName } from "./effect.ts";

const canonicalRules = [
  "eslint/no-restricted-imports",
  "nopeus/no-module-level-mutable-state",
  "nopeus/require-fetch-abort-signal",
  "nopeus/no-effect-runners-in-library",
  "nopeus/no-fallible-effect-promise",
  "nopeus/no-inline-live-layer",
  "nopeus/no-unscoped-fork",
  "nopeus/no-untyped-effect-errors",
  "nopeus/no-conditional-empty-object-spread",
  "nopeus/no-known-value-widening",
  "nopeus/no-module-mocking",
  "nopeus/no-object-parameters",
  "nopeus/no-reflect-apply",
  "nopeus/no-reflect-get",
  "nopeus/no-runtime-typeof",
  "nopeus/no-type-assertions",
  "nopeus/no-unknown-returns",
  "nopeus/no-unknown-type-aliases",
  "nopeus/no-unsafe-dictionary-type",
  "nopeus/prefer-effect-platform-services",
  "nopeus/prefer-effect-void",
  "nopeus/require-effect-fn-name",
  "nopeus/require-public-jsdoc",
  "nopeus/require-service-key-prefix",
  "nopeus/require-service-make-layer",
].sort();

test("derives a service-key prefix from an unscoped package name", () => {
  expect(serviceKeyPrefixFromPackageName("goho")).toBe("@goho/");
});

test("derives a service-key prefix from the project part of a scoped package name", () => {
  expect(serviceKeyPrefixFromPackageName("@adamaho/goho")).toBe("@goho/");
});

test("enables every shipped rule without overrides", () => {
  const config = effect({ packageName: "nopeus" });

  expect(Object.keys(config.rules ?? {}).sort()).toEqual(canonicalRules);
  expect("overrides" in config).toBe(false);
  for (const value of Object.values(config.rules ?? {})) {
    expect(Array.isArray(value) ? value[0] : value).toBe("error");
  }
});

test("configures the service-key rule from the package name", () => {
  const config = effect({ packageName: "nopeus" });

  expect(config.rules?.["nopeus/require-service-key-prefix"]).toEqual([
    "error",
    { prefix: "@nopeus/" },
  ]);
});

test("configures the runtime boundary from explicit entrypoints", () => {
  const config = effect({ packageName: "nopeus", runtimeEntryPoints: ["src/main.ts"] });

  expect(config.rules?.["nopeus/no-effect-runners-in-library"]).toEqual([
    "error",
    { allowFiles: ["src/main.ts"] },
  ]);
});

test("keeps the syntax policy independent of the native Effect toolchain", () => {
  const config = effect({ packageName: "nopeus" });
  expect("options" in config).toBe(false);
  expect("plugins" in config).toBe(false);
  expect(Object.keys(config.rules).some((name) => name.startsWith("effecttsgo/"))).toBe(false);
});

test("allows typeof only inside explicit type guards", () => {
  const config = effect({ packageName: "nopeus" });

  expect(config.rules?.["nopeus/no-runtime-typeof"]).toEqual([
    "error",
    { allowInTypeGuards: true },
  ]);
});

test("rejects a package name without a project segment", () => {
  expect(() => serviceKeyPrefixFromPackageName("@adamaho/")).toThrowError(
    new TypeError("packageName must contain a project name"),
  );
});
