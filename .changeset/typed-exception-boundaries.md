---
"@adamaho/nopeus-oxlint-plugin": minor
---

Add `nopeus/no-try-catch` to the Effect preset. Reject catch clauses in favor of
`Result.try`, `Effect.try`, `Effect.tryPromise`, or Effect recovery combinators.
Cleanup-only `try/finally` remains allowed, and the base preset is unchanged.
