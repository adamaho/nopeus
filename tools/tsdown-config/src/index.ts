import { defineConfig, type UserConfig } from "tsdown";

/** Apply the shared library build defaults, with explicit package options taking precedence. */
export function defineTsdownConfig(options: UserConfig): UserConfig {
  return defineConfig({
    format: "esm",
    dts: true,
    outDir: "dist",
    sourcemap: true,
    ...options,
  });
}
