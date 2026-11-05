---
"@adamaho/nopeus-oxlint-plugin": minor
---

Add the opt-in `nopeus/no-cross-domain-internals` rule. It requires imports
between configured domain roots to use each domain's declared public modules,
such as a repository, while imports within a domain and own-package tests keep
access to internals. The `/base` and `/effect` presets do not enable it.
