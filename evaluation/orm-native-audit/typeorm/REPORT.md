# TypeORM: no Serene change needed

Decision: document unchanged-runtime coexistence; no adapter, audit extension or
new general improvement is proposed. Continue to Prisma 7 under the updated PR
stop rules. Known QueryConfig and wrapper limitations are not new findings.

Pinned TypeORM 1.1.1, better-sqlite3 12.11.1 and reflect-metadata 0.2.2 are isolated
in this directory. Production files/dependencies remain unchanged.

Minimum application code:

```ts
const q = bind(sql`SELECT id FROM items WHERE id=:id`, {id}, 'anonymous');
await manager.query(q.text, q.values);
```

DataSource.query, EntityManager.query and QueryRunner.query accept this shape.
Use the transaction's manager/runner rather than the outer DataSource to retain
transaction ownership. The installed DataSource and EntityManager implementation
forwards text/parameters to the query runner. No SQL builder or formatter is needed.

`probe.mjs` executes real in-memory SQLite: hostile input returns only its matching
row, repeated named values and null survive binding, all three execution APIs work,
and a deliberate failure rolls back an insert. Six audit shapes are explicitly
asserted: the three direct execution calls ordinary, unknown text unresolved,
concatenation violation, and a method alias unresolved. `example.ts` type-checks
against the installed API (skipLibCheck skips dependency declaration checking,
not checking the example). PostgreSQL and other dialects are not executed.

Reproduce from repository root:

```sh
npm ci
npm ci --prefix evaluation/orm-native-audit/typeorm
node evaluation/orm-native-audit/typeorm/probe.mjs
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module NodeNext --moduleResolution NodeNext --skipLibCheck evaluation/orm-native-audit/typeorm/example.ts
```

Both study commands passed. Exact versions and full audit sources/findings are in
results.json and package-lock.json. This is an authored compatibility check, not
an AI review-efficiency claim or all-dialect certification.

Primary references: installed locked `data-source/DataSource.js`,
`entity-manager/EntityManager.js`, `driver/better-sqlite3/BetterSqlite3QueryRunner.js`,
and [official DataSource API](https://typeorm.io/docs/data-source/data-source-api/).
