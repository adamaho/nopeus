---
"@adamaho/nopeus-oxlint-plugin": patch
---

Accept exported layer factories paired with exported service constructors in
`require-service-make-layer`. Support direct and curried Layer constructors,
explicit configuration arguments, and provisioning pipes without requiring
configuration to move into a service module.

Keep constructor/service bindings and naming checks, and reset collected rule
state between files so one module cannot satisfy or duplicate another's reports.
