# Native QueryConfig bounded follow-up

Responds to PR #17 comment 5593873736. This is an evaluation-only prototype;
production runtime/audit remain unchanged. No other ORM phase has started.

## Decision

Recommend adopting the bounded recognition concept in a subsequent production
change: passing a recognized BoundSql directly to a `query` candidate, or passing
an inline object containing exactly plain `text` and `values` properties whose
receivers have recognized BoundSql provenance. The probe demonstrates native-only
benefit without recognizing Kysely factories. Productization remains a separate
review decision; this report does not measure review effort or universal safety.

## Minimal implementation

`prototype.mjs` injects one helper at the existing execution-argument classification
point in the hash-pinned v0.2 audit. It reuses the existing import/bind provenance
logic, and returns ordinary only for the two bounded forms. It does not modify the
production module or install a public API. A changed baseline hash fails the probe.

The extension is restricted to a non-aliased `query` candidate with exactly one
argument. Object aliases are never resolved, even const aliases. Inline objects
must have exactly two unique identifier-named data properties. Unknown fields,
getters, computed names, spreads, duplicates, casts and unknown provenance stay
unresolved. Concatenation inside a rejected object stays review-required as
requested; existing direct string-construction violations remain violations.

A BoundSql const alias can be recognized through existing provenance resolution:
its runtime object is identity-backed and frozen. A mutable object/config alias
cannot be treated equivalently and is not promoted. Values remain shallow and
mutable. Neither this prototype nor existing ordinary classification certifies
matching values, serialization, authorization or actual receiver identity.

## Evidence

`probe.mjs` asserts the before/after classification of all 25 cases, not just
selected positives. Five newly ordinary cases cover direct BoundSql, inline bind,
Pool-shaped calls, inline config and reversed property order. Eighteen negative
cases remain review-required; the existing direct text ordinary and concatenation
violation controls retain their classifications. Full source and output are in
`results.json`.

The native TypeScript example in `../kysely/native-example.ts` checks both
Client.query and Pool.query, with BoundSql and inline config, against the exact
pg and @types/pg versions in that directory's lockfile. It uses real external
types, typed result assignments, no casts, no stubs and no skipLibCheck. This is
compile-time compatibility, not live database execution. The existing pg runtime
normalization probe remains separate evidence.

The original Kysely probe now explicitly asserts all 9 source shapes across all
3 configurations (27 matrix cells), including classification codes and order.
The historic Kysely outcomes remain unchanged.

## Limits and production gate

The current audit identifies sinks by names rather than authenticated receiver
types. This prototype preserves that limitation: any non-aliased `.query` with
these shapes is a candidate, not proven pg execution. The host/application must
verify the actual execution API and parameter contract, as before. Do not expand
this rule to arbitrary configured sink names or arbitrary `.text` objects.

Before production adoption, port the bounded helper to production tests and check
source/diff filter behavior: ordinary recognition can affect source suppression.
This research has not changed or validated a production filter policy. Maintaining
unfiltered general/security review remains required. No general object-flow,
wrapper, cross-file or Kysely-specific analysis is justified by these results.

## Reproduce

From repository root, Node 24:

```sh
npm ci
npm ci --prefix evaluation/orm-native-audit/kysely
node evaluation/orm-native-audit/kysely/probe.mjs
node evaluation/orm-native-audit/native-query-config/probe.mjs
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module NodeNext --moduleResolution NodeNext evaluation/orm-native-audit/kysely/example.ts evaluation/orm-native-audit/kysely/native-example.ts
```

All commands above passed in this follow-up. The probes use no external database.
Production source and tooling have no diff from the baseline; the previous 127-test
production validation is retained, not relabeled as a new run.
