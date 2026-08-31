import assert from "node:assert/strict";
import test from "node:test";

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
  assert.equal(serviceKeyPrefixFromPackageName("goho"), "@goho/");
});

test("derives a service-key prefix from the project part of a scoped package name", () => {
  assert.equal(serviceKeyPrefixFromPackageName("@adamaho/goho"), "@goho/");
});

test("enables every shipped rule without overrides", () => {
  const config = effect({ packageName: "nopeus" });

  assert.deepEqual(Object.keys(config.rules ?? {}).sort(), canonicalRules);
  assert.equal("overrides" in config, false);
  for (const value of Object.values(config.rules ?? {})) {
    assert.equal(Array.isArray(value) ? value[0] : value, "error");
  }
});

test("configures the service-key rule from the package name", () => {
  const config = effect({ packageName: "nopeus" });

  assert.deepEqual(config.rules?.["nopeus/require-service-key-prefix"], [
    "error",
    { prefix: "@nopeus/" },
  ]);
});

test("allows typeof only inside explicit type guards", () => {
  const config = effect({ packageName: "nopeus" });

  assert.deepEqual(config.rules?.["nopeus/no-runtime-typeof"], [
    "error",
    { allowInTypeGuards: true },
  ]);
});

test("rejects a package name without a project segment", () => {
  assert.throws(() => serviceKeyPrefixFromPackageName("@adamaho/"), {
    name: "TypeError",
    message: "packageName must contain a project name",
  });
});
