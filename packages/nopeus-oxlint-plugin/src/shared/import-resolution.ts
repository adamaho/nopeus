import { dirname, isAbsolute, resolve } from "node:path";

import { ResolverFactory } from "oxc-resolver";

import { physicalPath } from "./package-layout.ts";

/** Resolve TS paths and Node package exports with the same conditions. */
export function importResolution() {
  const options = {
    extensions: [".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs", ".json"],
    extensionAlias: {
      ".js": [".ts", ".tsx", ".js"],
      ".mjs": [".mts", ".mjs"],
      ".cjs": [".cts", ".cjs"],
    },
    conditionNames: ["types", "import", "node", "default"],
    builtinModules: true,
  };
  const resolver = new ResolverFactory({ ...options, tsconfig: "auto" });
  // The fallback locates blocked deep imports solely to report the boundary violation.
  const internals = resolver.cloneWithOptions({ ...options, tsconfig: "auto", exportsFields: [] });
  return {
    target(filename: string, specifier: string): string | null {
      const resolved = resolver.resolveFileSync(filename, specifier);
      if (resolved.builtin) return null;
      if (resolved.path) return physicalPath(resolved.path);
      const fallback = internals.resolveFileSync(filename, specifier);
      if (fallback.path) return physicalPath(fallback.path);
      // The resolver exposes export-map rejection as text. Locate its package even
      // when a null export masks a wildcard target with a different physical path.
      if (resolved.error?.includes("is not exported")) {
        const name = specifier
          .split("/")
          .slice(0, specifier.startsWith("@") ? 2 : 1)
          .join("/");
        const manifest = internals.sync(dirname(filename), name + "/package.json");
        if (manifest.path) return physicalPath(manifest.path);
      }
      // Relative paths still reveal ownership when a new target has not been saved yet.
      if (specifier.startsWith(".") || isAbsolute(specifier)) {
        return physicalPath(resolve(dirname(filename), specifier));
      }
      return null;
    },
    publicTarget(filename: string, specifier: string): string | null {
      // No tsconfig aliases: the spelling must work through the package's own API.
      const result = resolver.sync(dirname(filename), specifier);
      return result.path ? physicalPath(result.path) : null;
    },
  };
}
