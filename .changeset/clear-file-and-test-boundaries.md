---
"@adamaho/nopeus-oxlint-config": minor
"@adamaho/nopeus-oxlint-plugin": minor
---

Enforce kebab-case source filenames and add canonical package/test boundaries.
The base and Effect presets require named tests under each package's sibling
test directory, prevent production imports of test code, and require public
entrypoints for cross-package imports. TypeScript aliases and workspace symlinks
are resolved through the new oxc-resolver dependency.

Previously accepted filenames, test locations, and internal imports may now
report errors. Move tests from src to test, rename spec files to test files,
and replace cross-package filesystem imports with public package imports.
