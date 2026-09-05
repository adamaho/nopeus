---
"@adamaho/nopeus-oxlint-plugin": minor
---

Add canonical rules for construction-owned mutable state and forwarding
Effect.tryPromise cancellation to global fetch. Document their supported syntax
and intentional exceptions with Effect v4 examples.

The plugin retains its ordinary Oxlint installation. Official Effect type-aware
diagnostics are enforced separately by the shared TypeScript configuration and
patched tsc; the README links to that setup. Existing Nopeus rules remain
enabled, and previously accepted code can now report the two additional errors.
