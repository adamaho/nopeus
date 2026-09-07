import { expect, test } from "vitest";

import { packageOwner } from "../src/shared/package-layout.ts";
import { testWorkspace } from "./helpers/workspace.ts";

test("module-format manifests do not replace real package boundaries", () => {
  const workspace = testWorkspace();
  try {
    for (const type of ["module", "commonjs"]) {
      workspace.write("packages/b/src/package.json", JSON.stringify({ type }));
      expect(packageOwner(workspace.file("packages/b/src/index.ts"))?.root).toBe(
        workspace.file("packages/b"),
      );
    }
    for (const manifest of [{ name: "nested", type: "module" }, { private: true }, {}]) {
      workspace.write("packages/b/src/package.json", JSON.stringify(manifest));
      expect(packageOwner(workspace.file("packages/b/src/index.ts"))?.root).toBe(
        workspace.file("packages/b/src"),
      );
    }
  } finally {
    workspace.cleanup();
  }
});
