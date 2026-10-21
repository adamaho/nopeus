---
"@adamaho/nopeus-oxlint-plugin": minor
---

Add an opt-in `@adamaho/nopeus-oxlint-plugin/react` preset and the opt-in
`nopeus/no-react-layer-imports` and `nopeus/no-cross-domain-internals` rules.
They keep router, SDK/cache, raw `fetch`, and feature data access in declared
React layers and require imports between configured domains to use public
modules. The `/base` and `/effect` presets are unchanged, and the preset does not
require React at runtime.
