# Knex: bounded coexistence, no Knex-specific adaptation

## Decision

Close the final planned ORM phase. No Serene production changes or new general
improvement candidate are justified. Some fixed SQL works with unchanged Serene,
but Knex.raw is a compiler/formatter boundary, not a transparent native-SQL path.
Reject Knex-specific placeholder escaping, marker correction, adapter or audit
special cases under the same criterion established for Sequelize. Do not make a
blanket compatibility claim. The known native QueryConfig candidate stays separate.

## Minimum code and executed cases

Knex 3.3.0 and better-sqlite3 13.0.3 are pinned in the isolated lockfile.

```ts
const q = bind(sql`SELECT id FROM items WHERE id=:id`, {id}, 'anonymous');
await db.raw(q.text, q.values);
```

This works for the tested basic SQLite statements. It also compiles to PostgreSQL
$1 markers using Knex's own compilation; Serene indexed output is not the chosen
input because Knex's array-binding interface expects question-mark placeholders.
No live PostgreSQL execution is claimed.

Real in-memory SQLite tests pass for hostile values, repeated bindings, null and
rollback through trx.raw. `example.ts` type-checks against installed Knex types
(skipLibCheck skips external declarations only). The PostgreSQL compilation
result is checked for SQL text and separate values. These tests do not certify
custom values containing Knex builders, raw objects or callbacks as ordinary data.

## Native-only counterexample

Serene correctly lowers a supplied parameter while preserving a quoted question
mark. This fixed SQL executes directly with better-sqlite3:

```sql
SELECT '?' AS literal, ? AS value
```

The same text and one value passed to Knex.raw fail during toSQL with:

```text
Expected 1 bindings, saw 2
```

The probe asserts both successful native execution with the unchanged literal and
the exact Knex failure. This is not a Serene scanner defect or an injection test
failure. Knex's rawFormatter scans question marks with a regex and treats the one
inside the literal as another binding. Its escape conventions would require
Knex-specific SQL authoring/rewriting. Serene will not absorb those conventions.
This is an instance of the already resolved downstream-reinterpretation category,
not a new unresolved general improvement or a reason to build a SQL parser.

## Audit

Default discovery does not include raw. Existing `--sink=raw` classifies the first
argument without product changes. All 6 shapes x 2 configurations are asserted:
ordinary direct/transaction/deferred construction, unresolved unknown text and
execution alias, and a concatenation violation. The deferred case is especially
important: raw constructs a thenable; the audit candidate is its construction,
not proof of an executed statement or an execution count. Generic raw names may
also match non-SQL APIs. This is the same candidacy/accounting limitation already
recorded in Kysely, not a new feature proposal.

## Reproduce and limits

From repository root, Node 24:

```sh
npm ci
npm ci --prefix evaluation/orm-native-audit/knex
node evaluation/orm-native-audit/knex/probe.mjs
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module NodeNext --moduleResolution NodeNext --skipLibCheck evaluation/orm-native-audit/knex/example.ts
```

Both study commands passed. Full version, case-source and result evidence is in
results.json and package-lock.json. Production runtime/audit/filter and root
dependencies remain unchanged. This is a bounded authored study, not measured AI
review efficiency or all-dialect support.

Primary evidence: installed locked `lib/formatter/rawFormatter.js`, `lib/raw.js`,
`lib/dialects/postgres/index.js`, and [official Knex raw guide](https://knexjs.org/guide/raw.html).
