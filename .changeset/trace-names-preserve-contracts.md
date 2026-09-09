---
"@adamaho/nopeus-oxlint-plugin": minor
---

Limit require-effect-namespace to traced functions and explicit span names, requiring @project/Domain.operation with PascalCase domain segments and a camelCase operation. Restore the separate service-key prefix rule in the Effect preset and extend it to Context.Reference with scope-aware import resolution. Stop enforcing trace prefixes on schema identifiers, data/error/request tags, and metrics so adopting the trace policy does not change serialization contracts.
