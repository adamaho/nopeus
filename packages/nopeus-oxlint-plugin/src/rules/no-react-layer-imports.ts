import { defineRule } from "@oxlint/plugins";

import {
  configRoot,
  matchesAny,
  optionObject,
  rootPath,
  rootPatterns,
  stringList,
  testPackage,
} from "#src/shared/config-root.ts";
import { importResolution } from "#src/shared/import-resolution.ts";
import { importSources } from "#src/shared/import-sources.ts";
import { physicalPath } from "#src/shared/package-layout.ts";
import { reactLayerDefaults } from "#src/shared/react-layers.ts";

const name = "nopeus/no-react-layer-imports";
const list = { type: "array", items: { type: "string", minLength: 1 }, uniqueItems: true };

function matchesModule(specifier: string, modules: readonly string[]): boolean {
  return modules.some((module) => specifier === module || specifier.startsWith(module + "/"));
}

/** Keep router, SDK/cache, and feature data imports in their declared React layers. */
export const noReactLayerImportsRule = defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Restrict router, SDK/cache, and local data imports to configured routes, adapters, containers, and data files.",
    },
    schema: [
      {
        type: "object",
        properties: {
          root: { type: "string", minLength: 1 },
          files: list,
          routes: list,
          adapters: list,
          containers: list,
          data: list,
          routerModules: list,
          queryModules: list,
          clientModules: list,
        },
        // Defaults cannot supply root, so the rule validates it when linting.
        additionalProperties: false,
      },
    ],
    defaultOptions: [reactLayerDefaults],
    messages: {
      router:
        "Import {{module}} only in routes or navigation adapters. Read route params there and pass explicit props or callbacks.",
      dataModule:
        "Import {{module}} only in configured data files. Expose feature data through the data layer.",
      localData:
        "Only routes, containers, and data files may consume feature data. Pass data to visual components as props.",
    },
  },
  create(context) {
    const option = optionObject(context.options[0]);
    const root = configRoot(name, option.root);
    const layer = (key: string) => rootPatterns(name, key, stringList(option[key]));
    const data = layer("data");
    const filename = physicalPath(context.filename);
    const path = rootPath(root, filename);
    // Tests may use router, query and data setup; package and domain rules still
    // limit them to their own package's internals.
    if (path === null || !matchesAny(path, layer("files")) || testPackage(filename)) return {};
    const isRoute = matchesAny(path, layer("routes"));
    const isAdapter = matchesAny(path, layer("adapters"));
    const isContainer = matchesAny(path, layer("containers"));
    const isData = matchesAny(path, data);
    const routerModules = stringList(option.routerModules);
    const dataModules = [...stringList(option.queryModules), ...stringList(option.clientModules)];
    const resolution = importResolution();
    return importSources(
      () => context.sourceCode,
      (node, specifier) => {
        if (matchesModule(specifier, routerModules)) {
          if (!isRoute && !isAdapter) {
            context.report({ node, messageId: "router", data: { module: specifier } });
          }
          return;
        }
        if (matchesModule(specifier, dataModules)) {
          if (!isData)
            context.report({ node, messageId: "dataModule", data: { module: specifier } });
          return;
        }
        if (isRoute || isContainer || isData) return;
        const target = resolution.target(filename, specifier);
        const targetPath = target === null ? null : rootPath(root, target);
        if (targetPath !== null && matchesAny(targetPath, data)) {
          context.report({ node, messageId: "localData" });
        }
      },
    );
  },
});
