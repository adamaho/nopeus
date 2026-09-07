---
"@adamaho/nopeus-oxlint-plugin": minor
---

Add ESLint base and Effect config factories that reuse the Nopeus custom rules
without Oxlint's fixed-size JavaScript-plugin raw-transfer allocator. Keep the
existing Oxlint presets for compatible environments while documenting the
split native-Oxlint/custom-ESLint workflow for constrained Linux runners.
