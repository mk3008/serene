# Serene

**Raw SQL is a little too raw.**

`@mk3008/serene` is a **micro screener for raw SQL review triage**. Keep SQL visible,
execute it with your native driver, and distinguish constrained construction from
SQL that needs additional review. Serene does not execute SQL.

Initial implementation: TypeScript/JavaScript, ESM, Node 22+. Not published to npm.
The application runtime entry has **zero runtime dependencies**. The optional
source audit tool uses TypeScript as a development-time peer dependency.

## Start with SQL

```ts
import { sql, bind } from '@mk3008/serene';

const findUsers = sql`
  SELECT id, name
  FROM users
  WHERE (:name::text IS NULL OR name = :name)
`;

const q = bind(findUsers, { name: input.name ?? null }, 'indexed');
const result = await pool.query(q.text, q.values); // application-owned native driver
```

The tag accepts a template literal with **no interpolation**. Author meaningful
`:name` parameters; select output markers at `bind`. The default is `named`, which
keeps `:name`. The example explicitly selects `$1` output. Output style is a parameter
contract, not a SQL dialect or a claim that the SQL is portable across databases.

Binding rejects missing and extra names, undefined values, inherited properties and
accessors. Names are case-sensitive ASCII identifiers. `null` is an explicit value.
SQL templates use ordinary JavaScript escape rules, so `sourceText` is the cooked SQL
body, not the TypeScript file's raw escape spelling.

## SQL for external investigation

`findUsers.sourceText` preserves the SQL before parameter lowering. `q.sourceText`
has the same review/debug representation; `q.params` holds a separate named-value
snapshot. Neither SQL text contains substituted values. The application can carry
these to DBeaver, a DB-connected MCP server, or a real-DB mapper test. Configure the
external tool's parameter support or supply its binding interface separately; this
is not a guarantee that every tool accepts `:name` without setup. Serene does not
connect, launch Docker, implement MCP, map rows, or inline values into debug SQL.

Keep the literal in a dedicated authoritative application source when following
Raw SQL Rules' default source requirement. Do not maintain a generated SQL mirror.
Fixed SQL can express optional predicates; assess its actual query plan yourself.

## Parameter output contracts

| `bind` third argument | Output markers | `names` / `values` ordering |
| --- | --- | --- |
| `named` (default) | `:id` | First occurrence of each name |
| `indexed` | `$1` | First occurrence of each name; repeated names reuse slots |
| `anonymous` | `?` | Every occurrence, including repeats |
| `at-named` | `@id` | First occurrence of each name |

```ts
const byName = sql`SELECT id, name FROM users WHERE name = :name`;
const p = bind(byName, { name }, 'indexed');
await pgPool.query(p.text, p.values);

const m = bind(byName, { name }, 'anonymous');
await connection.execute(m.text, m.values);

const s = bind(byName, { name }, 'at-named');
s.names.forEach((key, i) => request.input(key, s.values[i]));
await request.query(s.text);
```

The application still owns schema, driver configuration and target SQL validity.
See [test/examples.ts](https://github.com/mk3008/serene/blob/codex/review-triage-evaluation/test/examples.ts)
for type-checked call shapes. Use native
explicit parameter types where required and native prepared binding, not client-side
SQL formatting. Text, names and the named `params` snapshot are immutable. Values
are shallow and the `values` array remains mutable for driver compatibility; treat
it as read-only to keep all representations aligned. Pair matching text and values.

## Finite ORDER BY terms in any selected order

```ts
import { sql, sort, orderBy, bind } from '@mk3008/serene';

const base = sql`
  SELECT id, name, created_at FROM users WHERE tenant_id = :tenantId
`;
const query = orderBy(base, {
  nameAsc: sort`name ASC`,
  nameDesc: sort`name DESC`,
  createdDesc: sort`created_at DESC`,
  idAsc: sort`id ASC`,
}, ['createdDesc', 'nameAsc', 'idAsc']); // may instead be input.sortKeys

const q = bind(query, { tenantId }, 'indexed');
await pool.query(q.text, q.values);
```

This appends `ORDER BY created_at DESC, name ASC, id ASC`. Reversing the keys reverses
the priority. Runtime input selects keys and order, never SQL fragments. No enumeration
of every complete ordering is necessary. A single string key still works. An empty
array leaves the base unchanged; unknown keys, non-string keys and duplicate keys
throw. Distinct keys can still name the same column or opposing directions; the
application owns those semantics and any required stable tie-breaker.

Each static choice is an unquoted column path with optional ASC/DESC; static comma-
separated terms remain accepted. Expressions, quoted identifiers, NULLS FIRST/LAST,
comments and arbitrary fragments are unsupported. Define the finite map inline for
source auditing. Selection and text are snapshotted at `orderBy`; later map or key-
array mutation cannot alter them. Every map entry must be a genuine static `Sort`.

`orderBy` appends one final ORDER BY after a newline. The base must be suitable for
that suffix: no existing final ORDER BY, LIMIT/OFFSET, or statement terminator.
A terminator or repeated nonempty Serene `orderBy` is rejected; clause suitability
is still your responsibility. The base `sourceText` is unchanged, while the returned
SQL object's `sourceText` includes the selected ordering, before parameter lowering.
No WHERE builder or general SQL composition is provided.

## Review levels

| Level | Meaning | Review action |
| --- | --- | --- |
| `ordinary` | Recognized literal Serene construction and binding provenance | Review SQL meaning, authorization and driver use normally |
| `review-required` | Raw strings, unrecognized provenance, or unsupported source flow | Inspect how SQL is constructed and executed |
| `violation` | A detected Serene policy violation, such as interpolation or malformed lexical boundary | Fix it, or keep the exceptional implementation outside Serene and explicitly review it |

“Violation” means violation of this constrained path, **not proof of SQL injection**.
Using native raw SQL directly is allowed; it remains an additional-review item.
There is no `unsafe()` constructor that launders arbitrary strings into screened SQL.

Runtime `review(value)` recognizes genuine Serene SQL/binding objects by identity.
A plain string, copied object or forged TypeScript cast is not sufficient for
`bind` or runtime provenance. `SereneError` exposes `level`, `code`, and sometimes a
zero-based SQL offset; it never includes bound values in its message.

### Source inspection is required for ordinary review

JavaScript cannot prove that a tag's arguments originated in a literal: an adversarial
caller can manufacture frozen template arrays. **`review(value).level === 'ordinary'`
alone is not proof of literal source or SQL safety.** Run the source audit and retain
normal code review. This distinction is part of the API contract, not an optional
hardening feature.

```sh
npm install --save-dev typescript@5.9.3
npx --no-install serene-audit src/users.ts src/tickets.ts
npx --no-install serene-audit --strict --sink=runSql src/users.ts
```

Run `npm run build` first when developing this repository, and use
`node tooling/cli.mjs ...` before installing a packed artifact.

The tool emits JSON with file, line, column, boundary, level, code and explanation.
It inventories `.query`, `.execute`, `.unsafe`, same-named direct calls, and simple
local `const` aliases (including destructuring and `.bind`);
`--sink=name` adds application-specific call names. These are **driver candidates**,
not driver identity assertions: unrelated methods may also be reported. Aliases
are never ordinary: inspect receivers and prebound arguments even when the visible
argument is screened text. Unknown
computed calls are additional-review items. An exit code of 0 means no configured
failure, **not** no review work: exit 1 indicates a violation, or any additional-review
item with `--strict`; input/read/argument errors exit 2.

The audit recognizes named Serene imports (including aliases), literal tags,
immutable local variable chains, inline finite sort maps, binding and `.text`
extraction. It detects direct tag calls, SQL interpolation, addition, and common
`.join`/`.concat`/`.replace` constructions at known boundaries. Type assertions do
not establish provenance. Parse errors are violations.

The inventory is **file-local and deliberately incomplete**. It does not follow
cross-file exports, namespace imports, arbitrary wrappers, mutable renamed execution
functions, dynamically loaded code, or generated code not supplied to the CLI.
Unresolved candidates are never ordinary; an undiscovered call has no finding at
all. Supply every relevant source file and inventory your application's execution
APIs; add custom sink names or retain manual review for other routes. Zero findings
is not a whole-application SQL safety claim. See [security boundary](docs/security.md).

The [coverage guide](docs/review-coverage.md) separates detected, referred and unseen
paths. A historical 40-case synthetic study of the pre-redesign API improved sink discovery from 25/33 to 30/33, while
non-SQL false candidates increased from 3/7 to 4/7. This is a deterministic challenge
set result, not measured AI review effectiveness or real-world recall.

## Public API

- `sql`: literal tag returning opaque `Sql` with immutable `sourceText`.
- `sort`: restricted literal ordering returning opaque `Sort`.
- `orderBy(sql, choices, keyOrKeys)`: append whitelisted terms in selected order.
- `bind(sql, params?, style?)`: return `{ sourceText, text, values, names, params }`.
- `ParameterStyle`: `named | indexed | anonymous | at-named`.
- `review(value)`: runtime provenance level and reason code.
- `SereneError`: structured policy/binding failure.
- Optional `@mk3008/serene/audit`: `auditSource(source, filename?, { sinkNames? })`.

## Deliberate limits

A small **common lexical contract** remains necessary to distinguish parameters
from quoted text and comments. It accepts doubled single/double quotes, whitespace-
followed `--` comments, nonnested ordinary block comments and `::` casts. It does not
parse SQL grammar, infer a database, or change lexing based on output style.

It rejects mode-dependent quoted backslashes, executable/hint/nested comments,
non-whitespace `--`, alternative quote delimiters, and outside quotes/comments:
backticks, brackets, `#`, dollar forms and backslashes. Existing positional/`@name`
markers are rejected: author `:name`. These are deliberate restrictions, **not claims
that those constructs are unsafe SQL**. Some SQL accepted by the old DBMS tags now
requires the explicit additional-review route outside Serene. See the
[migration and Raw SQL Rules v0.2 assessment](docs/api-redesign.md).

No SQL syntax, schema, semantics, result typing, permissions, performance or
comprehensive vulnerability verification. No ORM, query/WHERE builder, driver
wrapper, connection/transaction manager, row mapper, code generator or DB dependency.
Bun.SQL and C#/Dapper adaptations are not implemented. They need their own evaluation
of whether a review-only tool supplies enough value; they do not justify wrappers.

## Development

```sh
npm ci
npm run check
npm pack
```

The only development dependency is TypeScript. Tests use Node's built-in test runner;
the lightweight lint command checks tooling JavaScript syntax. The optional audit
entry uses TypeScript; importing the main runtime entry never loads it. Tests include
policy boundaries, provenance spoofing, lexical regressions, CLI exit codes and
negative TypeScript compilation cases. No live database run is claimed.

See [design and provenance](docs/design.md) and [implementation report](docs/report.md).

License: MIT. Ashiba research was consulted and independently adapted without
depending on any Ashiba package; provenance and retained copyright are documented.
