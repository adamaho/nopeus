---
"@adamaho/nopeus-oxlint-config": minor
"@adamaho/nopeus-oxlint-plugin": minor
---

Fix package ownership for public exports inside directories whose package.json
only declares a module type. These directories no longer incorrectly create
separate package boundaries; real nested packages remain isolated.

Require ESM source and tests. The built-in config now rejects require calls,
TypeScript import-equals, module.exports, and exports assignments. The plugin's
base and Effect presets also reject TypeScript export assignments with the new
no-export-assignment rule.

Replace CommonJS syntax with ESM import/export syntax when upgrading both
packages. ESM imports of dependencies implemented in CommonJS remain allowed.
