import { defineRule } from "@oxlint/plugins";

import { importResolution } from "#src/shared/import-resolution.ts";
import { importSources } from "#src/shared/import-sources.ts";
import { packageOwner, physicalPath } from "#src/shared/package-layout.ts";

/** Require imports across package boundaries to use the target's public API. */
export const noCrossPackageInternalsRule = defineRule({
  meta: {
    type: "problem",
    docs: { description: "Disallow cross-package filesystem imports and private deep imports." },
    schema: [],
    messages: {
      boundary:
        "Import {{package}} through its package name and public exports, not another package's files.",
    },
  },
  create(context) {
    const filename = physicalPath(context.filename);
    const owner = packageOwner(filename);
    if (!owner) return {};
    const resolution = importResolution();
    return importSources(
      () => context.sourceCode,
      (node, specifier) => {
        const target = resolution.target(filename, specifier);
        if (!target) return;
        const destination = packageOwner(target);
        if (!destination || destination.root === owner.root) return;
        const name = destination.name;
        if (
          name &&
          (specifier === name || (destination.hasExports && specifier.startsWith(name + "/"))) &&
          resolution.publicTarget(filename, specifier) === target
        )
          return;
        context.report({
          node,
          messageId: "boundary",
          data: { package: name ?? destination.root },
        });
      },
    );
  },
});
