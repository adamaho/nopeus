---
"@adamaho/nopeus-oxlint-plugin": minor
---

Extend the canonical Effect policy with v4 type-aware diagnostics for discarded
and nested Effects, nested Promises, synchronous schema decoding, implementation
requirement leakage, and Effect-unaware tests. Add rules for construction-owned
mutable state and forwarding cancellation to global fetch.

The profile now requires the compatible, patched toolchain: `@effect/tsgo@0.41.0`,
`oxlint@1.79.0`, and `oxlint-tsgolint@7.0.2001`. Consumers must install these peers
and run `effect-tsgo patch --no-typescript --oxlint` after installation. Existing
Nopeus rules remain enabled; previously accepted code can now report additional
errors. Examples and consumer fixtures target `effect@4.0.0-rc.112`.
