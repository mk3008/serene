# Prisma 7: existing sink configuration is sufficient

Decision: no Serene production change, adapter or new general improvement is
needed for the inspected path. Document the version-specific recipe and sink
configuration, then continue to Sequelize. Prisma 8 is not covered.

Prisma CLI, generated client and better-sqlite3 adapter are pinned to 7.10.0 in
this isolated package. schema.prisma and the lockfile reproduce the client;
generated output is ignored. The probe used the generated 7.10.0 client and its
real SQLite adapter. Serene uses unchanged v0.2 runtime and audit.

```ts
const q = bind(sql`SELECT id FROM items WHERE id=:id`, {id}, 'anonymous');
await db.$queryRawUnsafe(q.text, ...q.values);
```

For writes use `$executeRawUnsafe`; inside `$transaction`, use its `tx` client.
The Unsafe name permits arbitrary caller strings but does not force interpolation:
this application path supplies fixed SQL and separate parameters. PostgreSQL
requires indexed markers instead; it is not live-tested in this phase.

The default audit does not discover these method names. Existing configuration
finds and classifies the first text argument without changing Serene:

```sh
node tooling/cli.mjs '--sink=$queryRawUnsafe' '--sink=$executeRawUnsafe' application-source
```

Quote dollar signs for shells that interpolate them. The example path above is a
placeholder for the application's source directory. Configuring names does not
prove receiver identity or correct value pairing.

Evidence in probe.mjs/results.json: real SQLite select/write, hostile value retained
as data, repeated binding, null, transaction rollback; 6 source shapes under both
default and configured audit settings explicitly asserted. Select/write/transaction
calls become ordinary when configured, unknown text and execution alias remain
review-required, concatenation remains violation. Typed example compiled against
the generated client using skipLibCheck for dependency declarations only.

No new analysis is required for variadic values because value-pair correctness is
already outside construction provenance. Native QueryConfig and general wrapper
issues remain the previously recorded decisions, not new adoption candidates.

Reproduce from repository root (Node 24):

```sh
npm ci
npm ci --prefix evaluation/orm-native-audit/prisma7
node evaluation/orm-native-audit/prisma7/node_modules/prisma/build/index.js generate --schema evaluation/orm-native-audit/prisma7/schema.prisma
node evaluation/orm-native-audit/prisma7/probe.mjs
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module NodeNext --moduleResolution NodeNext --skipLibCheck evaluation/orm-native-audit/prisma7/example.ts
```

The generated client was produced and consumed successfully; probe and typecheck
passed. This does not claim all Prisma versions/dialects or AI review efficiency.
Primary reference: [Prisma 7 raw queries](https://www.prisma.io/docs/orm/v7/prisma-client/using-raw-sql/raw-queries), alongside the locked generated client and adapter used by the probe.
