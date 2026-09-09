# Sequelize: stop at downstream SQL rewriting boundary

## Outcome and stop decision

Sequelize 6.37.8 can receive Serene text and separate values via bind, and its
query method is already an audit candidate. However, it does not generally
preserve fixed native SQL text. Stop before Knex under PR comment 5594087865's
security-contract/design-decision rule. Do not add a Sequelize escape adapter or
change Serene's runtime, scanner, audit or filter to compensate.

The pending decision is how this path may be described in coexistence guidance:
reject it as a transparent native-SQL recipe, or explicitly scope a guide to
Sequelize's additional SQL authoring conventions. This is not a request to build
compatibility features. Recommended disposition: no blanket compatibility claim;
any later guide must require independent review of downstream SQL handling.

## Reproduction

With Serene indexed output and an ordinary separated value:

```sql
SELECT '$$' AS literal, $1::text AS value
```

Actual Sequelize PostgreSQL query processing sends the following text to the
recording driver's query method:

```sql
SELECT '$' AS literal, $1::text AS value
```

The value remains separate and unchanged. This is a deterministic SQL literal
rewrite, not evidence of SQL injection, exploitation or a Serene binding bug.
No live PostgreSQL server was used. The before/after bytes are asserted and
recorded in results.json.

The installed `lib/dialects/abstract/query.js` uses a dollar-token replacement
pass; PostgreSQL `formatBindParameters` invokes it even for array bindings with
skipValueReplace. That prevents value substitution but does not disable dollar
unescaping. The same input is then processed by actual Sequelize.query and its
PostgreSQL Query implementation in the probe, with only connection acquisition
and the final pg client replaced by recording doubles.

## Relation to Serene's contract

Serene guarantees construction provenance and separated values, not SQL semantics
or correct downstream interpretation. The default audit marks `db.query(q.text,
{bind:q.values})` ordinary because it follows only SQL construction provenance;
this does not certify the executor. This finding does not establish an incorrect
ordinary finding under the existing conditional contract.

Nevertheless, docs/security.md explicitly requires review of downstream
formatters/transpilers/composers and actual binding. Unlike the examined Kysely
compiled path, this path has an additional SQL-text interpretation step. Treating
it as transparent native execution would misstate the evidence. The pause is for
the interoperability-guidance boundary, not a claim that Serene's guarantees have
been disproved. No new general-purpose SQL parser or audit feature is justified.

## Completed checks and limits

- Pinned Sequelize 6.37.8 / pg 8.23.0 in an isolated package.
- Actual Sequelize-to-recording-pg processing passes indexed and named bind cases,
  hostile input separation, repeated references, null, and the literal rewrite.
- Six default audit cases explicitly asserted: indexed, named and transaction
  syntax ordinary; unknown text and alias unresolved; direct concatenation violation.
- example.ts compiles against installed types (skipLibCheck for declarations).
- SQLite execution was attempted but its native dependency build failed. It was
  not executed, and no live SQL/rollback claim is made. The retained package uses
  pg for reproducible driver-boundary probes instead. No custom SQLite shim or
  database emulation substitutes for the missing live result.
- replacements is excluded; native QueryConfig and wrapper analysis are not
  reopened. Neither downstream feature additions nor production changes are made.

## Reproduce

From repository root, Node 24:

```sh
npm ci
npm ci --prefix evaluation/orm-native-audit/sequelize
node evaluation/orm-native-audit/sequelize/probe.mjs
./node_modules/.bin/tsc --noEmit --strict --target ES2022 --module NodeNext --moduleResolution NodeNext --skipLibCheck evaluation/orm-native-audit/sequelize/example.ts
```

Probe and typecheck passed. This probe opens no external database connection.
Primary sources: locked Sequelize `lib/sequelize.js`,
`lib/dialects/postgres/query.js`, `lib/dialects/abstract/query.js`, and
[official v6 bind documentation](https://sequelize.org/docs/v6/core-concepts/raw-queries/#bind-parameter).
