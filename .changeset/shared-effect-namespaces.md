---
"@adamaho/nopeus-oxlint-plugin": minor
---

Enforce the repository namespace across Effect service/reference keys, traced functions and spans, schema class identifiers, tagged data/errors/requests, and metric names. The Effect preset replaces require-service-key-prefix with require-effect-namespace; the original service-only rule remains available for manual configurations. Existing identifiers may need renaming, including their serialized tags and matching code. Accept namespaced Effect.fn owner names and resolve imported bindings without confusing shadowed locals.
