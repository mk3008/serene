# Serene

Read README.md and docs/security.md before changing public behavior. Keep raw SQL
review triage as the product boundary and docs/design.md as the rationale.

- Keep the main runtime entry dependency-free and native-driver execution external.
- Do not add an ORM, general SQL/WHERE builder, arbitrary fragment API or unsafe
  constructor that grants ordinary provenance to runtime strings.
- Unknown provenance must not silently become ordinary. Document audit coverage limits.
- For boundary changes, add meaningful regression and negative tests before claiming
  completion. Do not weaken tests to fit an implementation.
- Run npm run check and check the packed artifact when changing package exports.
- Do not publish to npm or change external repository settings without authorization.
