import { statSync } from "node:fs";
import { relative, resolve } from "node:path";

import { defineRule } from "@oxlint/plugins";

import {
  configRoot,
  isDirectory,
  isWithin,
  optionObject,
  type OptionValue,
  stringList,
  testPackage,
} from "#src/shared/config-root.ts";
import { importResolution } from "#src/shared/import-resolution.ts";
import { importSources } from "#src/shared/import-sources.ts";
import { packageOwner, physicalPath } from "#src/shared/package-layout.ts";

const name = "nopeus/no-cross-domain-internals";

interface Domain {
  readonly root: string;
  readonly publicModules: ReadonlySet<string>;
}

function invalid(message: string): never {
  throw new TypeError(name + ": " + message);
}

function configuredDomains(root: string, value: OptionValue | undefined): readonly Domain[] {
  const domains = (Array.isArray(value) ? value : []).map((option) => {
    const domain = optionObject(option);
    const directory = resolve(root, String(domain.root));
    if (!isWithin(root, directory) || !isDirectory(directory)) {
      invalid(
        `domain root ${JSON.stringify(domain.root)} must be an existing directory inside ${root}.`,
      );
    }
    const publicModules = stringList(domain.public).map((path) => {
      const filename = resolve(directory, path);
      if (
        !isWithin(directory, filename) ||
        !statSync(filename, { throwIfNoEntry: false })?.isFile()
      ) {
        invalid(
          `public module ${JSON.stringify(path)} must be an existing file path relative to ${relative(root, directory) || "."}.`,
        );
      }
      return physicalPath(filename);
    });
    return { root: physicalPath(directory), publicModules: new Set(publicModules) };
  });
  // The most specific configured root owns files in nested domains.
  return domains.sort((left, right) => right.root.length - left.root.length);
}

/** Require imports between configured domains to use their declared public modules. */
export const noCrossDomainInternalsRule = defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Disallow imports of another configured domain's non-public modules.",
    },
    schema: [
      {
        type: "object",
        properties: {
          root: { type: "string", minLength: 1 },
          domains: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              properties: {
                root: { type: "string", minLength: 1 },
                public: {
                  type: "array",
                  items: { type: "string", minLength: 1 },
                  uniqueItems: true,
                },
              },
              required: ["root", "public"],
              additionalProperties: false,
            },
          },
        },
        required: ["root", "domains"],
        additionalProperties: false,
      },
    ],
    messages: {
      internal:
        "Import {{domain}} only through its public modules ({{public}}); keep its implementation private.",
    },
  },
  create(context) {
    const option = optionObject(context.options[0]);
    const root = configRoot(name, option.root);
    const domains = configuredDomains(root, option.domains);
    const owner = (path: string) => domains.find((domain) => isWithin(domain.root, path));
    const filename = physicalPath(context.filename);
    const consumer = owner(filename);
    const tests = testPackage(filename);
    const resolution = importResolution();
    return importSources(
      () => context.sourceCode,
      (node, specifier) => {
        const target = resolution.target(filename, specifier);
        if (target === null) return;
        const domain = owner(target);
        if (!domain || domain === consumer || domain.publicModules.has(target)) return;
        // Tests may reach their own package's internals; other packages stay bounded.
        if (tests !== null && packageOwner(target)?.root === tests) return;
        context.report({
          node,
          messageId: "internal",
          data: {
            domain: relative(root, domain.root) || ".",
            public:
              [...domain.publicModules].map((path) => relative(domain.root, path)).join(", ") ||
              "none declared",
          },
        });
      },
    );
  },
});
