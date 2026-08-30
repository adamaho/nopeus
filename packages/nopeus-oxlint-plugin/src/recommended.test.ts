import assert from "node:assert/strict";
import test from "node:test";

import recommended, { serviceKeyPrefixFromPackageName } from "./recommended.ts";

test("derives a service-key prefix from an unscoped package name", () => {
  assert.equal(serviceKeyPrefixFromPackageName("goho"), "@goho/");
});

test("derives a service-key prefix from the project part of a scoped package name", () => {
  assert.equal(serviceKeyPrefixFromPackageName("@adamaho/goho"), "@goho/");
});

test("configures the service-key rule from the package name", () => {
  const config = recommended({ packageName: "nopeus" });

  assert.deepEqual(config.rules?.["nopeus/require-service-key-prefix"], [
    "error",
    { prefix: "@nopeus/" },
  ]);
});

test("rejects a package name without a project segment", () => {
  assert.throws(() => serviceKeyPrefixFromPackageName("@adamaho/"), {
    name: "TypeError",
    message: "packageName must contain a project name",
  });
});
