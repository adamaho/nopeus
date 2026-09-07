import { defineRule } from "@oxlint/plugins";

import { importResolution } from "../shared/import-resolution.ts";
import { importSources } from "../shared/import-sources.ts";
import { isTestPath, packageOwner, packagePath, physicalPath } from "../shared/package-layout.ts";

/** Keep test dependencies out of a package's production source tree. */
export const noTestImportsRule = defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Disallow production source imports of tests, test helpers, and fixtures.",
    },
    schema: [],
    messages: {
      testImport:
        "Production source cannot import test code or resources. Move shared production code into src/.",
    },
  },
  create(context) {
    const filename = physicalPath(context.filename);
    const owner = packageOwner(filename);
    if (!owner || !packagePath(owner, filename).startsWith("src/")) return {};
    const resolution = importResolution();
    return importSources(
      () => context.sourceCode,
      (node, specifier) => {
        const target = resolution.target(filename, specifier);
        if (!target) return;
        const destination = packageOwner(target);
        if (destination && isTestPath(packagePath(destination, target))) {
          context.report({ node, messageId: "testImport" });
        }
      },
    );
  },
});
