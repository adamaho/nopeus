import { expect, test } from "vitest";

import effect, { serviceKeyPrefixFromPackageName } from "./effect.ts";

const canonicalRules = [
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
  "nopeus/require-effect-fn-name",
  "nopeus/require-public-jsdoc",
  "nopeus/require-service-key-prefix",
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
