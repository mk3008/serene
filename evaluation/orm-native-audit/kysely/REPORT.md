# Kysely: unchanged runtime works; distinguish native audit gaps

## Decision proposal

- Accept the existing-runtime example as a bounded coexistence recipe, not a
  promise of full Kysely integration or automatic ordinary classification.
- Reject a Kysely adapter, CompiledQuery-specific provenance recognition, AST
  integration, or a generic trusted-factory hook created to support Kysely.
- Accept native query-config recognition as a **separate improvement candidate**:
  `pg.query(q)` and `pg.query({ text: q.text, values: q.values })` are natural
  native-driver calls that the current audit leaves unresolved. No product change
  is implemented or approved by this report. Decide that bounded follow-up before
  progressing to another library.
- Do not adopt interprocedural wrapper analysis from this small study. It would
  help some native cases, but this study establishes neither payoff nor a safe,
  sufficiently small implementation.

## Baseline and scope

Research branch starts at Serene main `a7525ca7dd324ac9a22f83a2f188249f207c538d`.
`git diff v0.2.0 HEAD -- src tooling` was empty before adding this study: runtime
and audit are identical to the v0.2.0 tag. The resolved tag commit, Node version,
exact dependency versions and production-file hashes are in `results.json`.
Dependencies are pinned in this directory's lockfile (Kysely 0.29.5).

This is a deterministic, author-designed compatibility and discovery probe. It is
not an AI review study, vulnerability-rate estimate, performance measurement or
complete driver/dialect support certification. Other ORM phases are unstarted.

## Minimum application code

```ts
const q = bind(sql`SELECT id FROM items WHERE id = :id`, { id }, 'indexed');
const result = await db.executeQuery<{ id: number }>(
  CompiledQuery.raw(q.text, [...q.values]),
);
```

`example.ts` type-checks this PostgreSQL-shaped example against installed APIs.
Use `anonymous` for the tested SQLite path. Use the transaction object `trx`
instead of outer `db` when participating in a Kysely transaction.

Product code needed: **zero**. The external wrapping call retains SQL and values;
it does not require Serene to compose SQL fragments or parse a Kysely AST.
The array copy avoids Kysely 0.29.5 freezing Serene's original mutable values array.
This is shallow; it does not certify custom value serialization.

The compiled path skips query-transform plugins, while result-transform plugins
still run (source inspection and probe). Do not assume plugin-injected tenant
conditions or query rewrites run here. Result generic types are annotations, not
SQL-result verification. Existing security.md restrictions on unreviewed composers
still apply: this inspected path forwards SQL unchanged, not through a formatter.

## Executed evidence

`probe.mjs` checks:

- Real in-memory SQLite through better-sqlite3, directly and through actual Kysely
  SqliteDialect: identical rows, hostile input remains a value, repeated named
  parameter lowering, null handling, and real transaction rollback.
- Actual Kysely PostgresDialect with a recording pool client: indexed SQL and
  separate values arrive unchanged. **No live PostgreSQL server was used.**
- Actual pg Query normalization accepts BoundSql and `{text, values}` objects.
  This verifies input normalization, not PostgreSQL wire behavior or execution.
- A plugin counter establishes the compiled-query transform boundary.
- Nine source shapes, each under default, execution-name configured, and
  execution-plus-raw-name configured audit settings. Full sources and findings
  are retained in `results.json`.

| Source shape | Default execution findings | With executeQuery configured |
| --- | --- | --- |
| Native `query(q.text, q.values)` | ordinary | ordinary |
| Native `query(q)` | review-required | review-required |
| Native `query({text: q.text, values: q.values})` | review-required | review-required |
| Same config through local const | review-required | review-required |
| Concatenation inside native config.text | review-required | review-required |
| Native wrapper function | review-required | review-required |
| Kysely compiled object | no execution candidate | review-required |
| Kysely compiled object with concatenated SQL | no execution candidate | review-required |
| Native direct concatenated SQL | violation | violation |

Serene construction findings are excluded from these execution-site counts.
No execution finding does not mean safe. An unresolved config is conservative
referral, not a vulnerability or false ordinary. Recognizing config.text could
also expose its currently obscured concatenation; exploitability remains separate.

Existing `--sink=executeQuery` is enough to inventory Kysely execution for manual
review. Also configuring `--sink=raw` exposes the inner CompiledQuery.raw SQL
argument (ordinary for q.text, violation for concatenation), but creates an extra
construction candidate labeled as driver-candidate and may match unrelated raw
methods. It does **not** establish the outer execution as ordinary. Do not report
those two findings as two real SQL executions or make raw globally trusted.

## What code would actually be needed?

| Gap | Minimum mechanism | Decision |
| --- | --- | --- |
| Missing executeQuery candidate | Existing sink configuration; no source edit | Use as needed |
| Opaque CompiledQuery.raw result | Imported factory identity, SQL argument projection, propagation to execution | Reject: Kysely-specific benefit demonstrated |
| Native BoundSql/config object unresolved | Bounded extraction of SQL from approved native call shapes, then existing provenance classification | Native improvement candidate |
| User wrapper unresolved | Parameter/call-site propagation with mutation and multiple-call handling | Defer; too broad for present evidence |
| Value pairing/transaction correctness | Integration tests and application review | Keep separate from construction audit |

For the native candidate, the implementation boundary matters. Do not simply
trust any `.text` property or use duck typing to grant ordinary. Start with a
known bound result or an inline plain data object at a candidate native query
call. Require negative cases for getters, computed keys, spreads/overwrites,
mutated aliases, unknown text, casts, and raw concatenation. Mutable const object
aliases require write/escape analysis or must stay review-required. Unknown
wrappers must remain unresolved. Whether these conservative limits save enough
review work is a separate decision; this probe does not measure that benefit.

The native implementation alone would **not** recognize CompiledQuery.raw, and
that is acceptable. A feature does not need to finish Kysely support to be useful.

## Reproduce

From the repository root, using Node 24 (native SQLite package build requirements
may vary by platform):

```sh
npm ci
npm ci --prefix evaluation/orm-native-audit/kysely
node evaluation/orm-native-audit/kysely/probe.mjs
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module NodeNext --moduleResolution NodeNext --skipLibCheck evaluation/orm-native-audit/kysely/example.ts
npm run check
```

The probe rewrites results.json only, uses an in-memory database, and connects to
no external database. Production behavior is unchanged.

## Primary references

Installed locked package source was inspected for compiled-query.js, kysely.js,
query-executor-base.js and the PostgreSQL/SQLite drivers. These installed sources
are authoritative for the executed version; moving web documentation is context.

- [Kysely CompiledQuery source](https://github.com/kysely-org/kysely/blob/v0.29.5/src/query-compiler/compiled-query.ts)
- [Kysely executeQuery](https://github.com/kysely-org/kysely/blob/v0.29.5/src/kysely.ts)
- [Kysely PostgreSQL driver](https://github.com/kysely-org/kysely/blob/v0.29.5/src/dialect/postgres/postgres-driver.ts)
- [Kysely executor](https://github.com/kysely-org/kysely/blob/v0.29.5/src/query-executor/query-executor-base.ts)
- [node-postgres QueryConfig API](https://node-postgres.com/apis/client)
- [Serene v0.2 audit](https://github.com/mk3008/serene/blob/v0.2.0/tooling/audit.mjs)

Validation on this branch: the probe completed all eight named checks; the
standalone TypeScript example passed type checking; `npm run check` passed
lint/typecheck and all 127 existing tests; `git diff --check` passed. These do not
upgrade the explicitly unexercised live PostgreSQL path to tested support.
