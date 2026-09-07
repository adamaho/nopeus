import { defineRule } from "@oxlint/plugins";

import { isTestFile, packageOwner, packagePath } from "../shared/package-layout.ts";

/** Place named test files under the owning package's sibling test directory. */
export const requireTestLocationRule = defineRule({
  meta: {
    type: "problem",
    docs: { description: "Require .test filenames under the nearest package's test/ directory." },
    schema: [],
    messages: {
      location:
        "Place this test under its package's test/ directory, alongside src/, using a .test filename.",
    },
  },
  createOnce(context) {
    return {
      Program(node) {
        if (!isTestFile(context.filename)) return;
        const owner = packageOwner(context.filename);
        if (!owner) return;
        const path = packagePath(owner, context.filename);
        if (!path.startsWith("test/") || /\.spec\.(?:[cm]?[jt]s|[jt]sx)$/u.test(path)) {
          context.report({ node, messageId: "location" });
        }
      },
    };
  },
});
