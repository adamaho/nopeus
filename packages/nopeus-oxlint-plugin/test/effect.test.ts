import { expect, test } from "vitest";

import effect, { serviceKeyPrefixFromPackageName } from "#src/effect.ts";
import plugin from "#src/index.ts";

const canonicalRules = [
  "nopeus/no-export-assignment",
  "nopeus/no-cross-package-internals",
  "nopeus/no-test-imports",
  "nopeus/require-test-location",
  "eslint/no-restricted-imports",
  "nopeus/no-module-level-mutable-state",
  "nopeus/require-fetch-abort-signal",
  "nopeus/no-effect-runners-in-library",
  "nopeus/no-fallible-effect-promise",
  "nopeus/no-inline-live-layer",
  "nopeus/require-effect-construction-spacing",
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
  "nopeus/require-effect-namespace",
  "nopeus/require-service-key-prefix",
  "nopeus/require-service-constructor-names",
].sort();

test("derives a service-key prefix from an unscoped package name", () => {
  expect(serviceKeyPrefixFromPackageName("goho")).toBe("@goho/");
});

test("derives a service-key prefix from the project part of a scoped package name", () => {
  expect(serviceKeyPrefixFromPackageName("@adamaho/goho")).toBe("@goho/");
});

test("enables every canonical rule without overrides", () => {
  const config = effect({ packageName: "nopeus" });

  expect(Object.keys(config.rules ?? {}).sort()).toEqual(canonicalRules);
  expect("overrides" in config).toBe(false);
  for (const value of Object.values(config.rules ?? {})) {
    expect(Array.isArray(value) ? value[0] : value).toBe("error");
  }
});

test("configures the namespace rule from the package name", () => {
  const config = effect({ packageName: "nopeus" });

  expect(config.rules?.["nopeus/require-effect-namespace"]).toEqual([
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

test("the Effect preset enables every canonical plugin rule", () => {
  const config = effect({ packageName: "nopeus" });
  for (const name of Object.keys(plugin.rules)) {
    expect(config.rules).toHaveProperty("nopeus/" + name);
  }
  expect(plugin.rules).not.toHaveProperty("require-service-make-layer");
});
