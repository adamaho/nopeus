---
"@adamaho/nopeus-oxlint-plugin": minor
---

Replace `require-service-make-layer` with `require-service-constructor-names`,
always enabled in the canonical Effect preset. Public Layers use `layer` or
`layerX`; public service constructors use `make` or `makeX`. Neither requires the
other, constructors may remain private, and suffixes do not need to match.

Allow parameterized factories, inline construction, config wrappers, and Layer
composition. Remove the old pairing rule entirely. Consumers that explicitly
reference its name must remove that entry when upgrading; canonical preset
consumers receive the replacement automatically.
