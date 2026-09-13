---
"@adamaho/nopeus-oxlint-config": minor
---

Enable `import/no-relative-parent-imports` in the shared default config. Source
and tests must replace parent-directory imports with package-local Node aliases
declared in `package.json` `imports`; same-directory `./` imports remain allowed.
