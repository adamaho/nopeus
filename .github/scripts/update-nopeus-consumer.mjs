import { readFile, writeFile } from "node:fs/promises";

const [workspacePath, configVersion, pluginVersion, tsconfigVersion] = process.argv.slice(2);
const versions = new Map([
  ["@adamaho/nopeus-oxlint-config", configVersion],
  ["@adamaho/nopeus-oxlint-plugin", pluginVersion],
  ["@adamaho/nopeus-tsconfig", tsconfigVersion],
]);

if (!workspacePath || [...versions.values()].some((version) => !/^\d+\.\d+\.\d+$/u.test(version))) {
  throw new TypeError("usage: update-nopeus-consumer.mjs <workspace> <config> <plugin> <tsconfig>");
}

let workspace = await readFile(workspacePath, "utf8");
for (const [packageName, version] of versions) {
  const pattern = new RegExp(`^(\\s*['"]?${packageName}['"]?\\s*:\\s*)\\S+(\\s*)$`, "mu");
  const matches = workspace.match(new RegExp(pattern.source, "gmu"));
  if (matches?.length !== 1) {
    throw new Error(`expected one catalog entry for ${packageName}, found ${matches?.length ?? 0}`);
  }
  workspace = workspace.replace(pattern, `$1${version}$2`);
}

await writeFile(workspacePath, workspace);
