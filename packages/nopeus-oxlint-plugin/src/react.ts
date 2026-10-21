import { defineConfig } from "oxlint";

import { rootPatterns } from "./shared/config-root.ts";
import { reactLayerDefaults } from "./shared/react-layers.ts";

export interface NopeusReactOptions {
  /** The consuming Oxlint config's absolute directory, usually `import.meta.dirname`. */
  readonly root: string;
  /** Source files governed by this policy. Patterns below are relative to `root`. */
  readonly files?: readonly string[];
  /** Route boundaries: may import routers and consume feature data. */
  readonly routes?: readonly string[];
  /** Navigation adapters: may import routers. */
  readonly adapters?: readonly string[];
  /** Feature pages and containers: may consume feature data. */
  readonly containers?: readonly string[];
  /** Data layer files: may import SDK/cache modules and other data files. */
  readonly data?: readonly string[];
  /** Explicit raw `fetch` locations, such as a transport adapter or generated client. */
  readonly transports?: readonly string[];
  /**
   * Test setup that may use raw `fetch`, replacing the root-level `test/**`,
   * `tests/**`, `__tests__`, and test/spec suffix defaults. A monorepo root
   * config can list package tests, such as `packages/app/test/**`.
   */
  readonly fetchTestFiles?: readonly string[];
  /** Concrete router modules, matched with their subpaths. */
  readonly routerModules?: readonly string[];
  /** Cache library modules, matched with their subpaths. */
  readonly queryModules?: readonly string[];
  /** Project SDK/client modules, matched with their subpaths. */
  readonly clientModules?: readonly string[];
}

// Test resources keep the normal policy, but may set up transports with fetch.
const testFiles = ["test/**", "tests/**", "**/__tests__/**", "**/*.{test,spec}.*"];
const fetchMessage = "Use the project SDK/client or a declared transport adapter instead of fetch.";

/** Build opt-in React routing and data-layer boundaries. */
export default function react({
  transports = [],
  fetchTestFiles = testFiles,
  ...layers
}: NopeusReactOptions) {
  // Oxlint resolves override globs from the config directory; the import rule
  // normalizes its own `files` the same way, so both select the same files.
  const pattern = (key: string, patterns: readonly string[]) =>
    rootPatterns("react", key, patterns);
  return defineConfig({
    jsPlugins: [{ name: "nopeus", specifier: "@adamaho/nopeus-oxlint-plugin" }],
    rules: { "nopeus/no-react-layer-imports": ["error", layers] },
    overrides: [
      {
        files: pattern("files", layers.files ?? reactLayerDefaults.files),
        excludeFiles: [
          ...pattern("transports", transports),
          ...pattern("fetchTestFiles", fetchTestFiles),
        ],
        rules: {
          // checkGlobalObject also reports globalThis.fetch, self.fetch, and window.fetch.
          "eslint/no-restricted-globals": [
            "error",
            { globals: [{ name: "fetch", message: fetchMessage }], checkGlobalObject: true },
          ],
        },
      },
    ],
  });
}
