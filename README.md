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
import { postgres, bind } from '@mk3008/serene';

const findUsers = postgres`
  SELECT id, name
  FROM users
  WHERE (:name::text IS NULL OR name = :name)
`;

const q = bind(findUsers, { name: input.name ?? null });
const result = await pool.query(q.text, q.values); // native pg
```

The tag accepts a template literal with **no interpolation**. Values enter only
through `bind`. `:name` becomes `$1`; repeated names reuse that position. Binding
rejects missing and extra names, undefined values, inherited properties and
accessors. Names are case-sensitive ASCII identifiers. `null` is an explicit value.
SQL templates use ordinary JavaScript escape rules.

SQL remains the responsibility of the application. Fixed SQL can express optional
predicates; assess its query plan yourself. Serene does not add a WHERE builder.

## Direct native drivers

| Tag | Application SQL parameters | Output | Driver call |
| --- | --- | --- | --- |
| `postgres` | `:id` | `$1`, deduplicated values | `pool.query(q.text, q.values)` |
| `mysql` | `:id` | `?`, one value per occurrence | `connection.execute(q.text, q.values)` |
| `mssql` | `@id` or `:id` | `@id`, deduplicated names/values | `request.input(...)`, then `request.query(q.text)` |

```ts
import { mysql, mssql, bind } from '@mk3008/serene';

const my = bind(mysql`SELECT id FROM users WHERE id = :id`, { id });
const [rows] = await connection.execute(my.text, my.values);

const ms = bind(mssql`SELECT id FROM users WHERE id = @id`, { id });
const request = pool.request();
ms.names.forEach((name, i) => request.input(name, ms.values[i]));
const result = await request.query(ms.text);
```

For mssql, supply native explicit parameter types when needed. Serene does not
infer or unify database types. Use mysql2 **execute**, not client-side SQL formatting.
The returned values array is mutable for driver compatibility; text and names are
immutable. Pass matching text and values without rewriting them. Dialects are
explicit lexical profiles, not portable SQL or interchangeable drivers.

## Finite ORDER BY choices

```ts
import { postgres, sort, orderBy, bind } from '@mk3008/serene';

const base = postgres`
  SELECT id, name, created_at FROM users WHERE tenant_id = :tenantId
`;
const query = orderBy(base, {
  name: sort`name ASC, id ASC`,
  newest: sort`created_at DESC, id DESC`,
}, input.sort);

const q = bind(query, { tenantId });
await pool.query(q.text, q.values);
```

An unknown key throws; there is no implicit fallback. Each choice is a literal
column path with optional ASC/DESC, separated by commas. Expressions, quoted
identifiers, NULLS FIRST/LAST, comments and arbitrary fragments are intentionally
unsupported in this initial sort API. Define the finite map inline for source
auditing. The selected text is snapshotted at `orderBy`, so later map mutation
cannot alter it.

`orderBy` appends one final ORDER BY after a newline. The base must be suitable for
that suffix: no existing final ORDER BY, LIMIT/OFFSET, or statement terminator.
A terminator or repeated Serene `orderBy` is rejected; SQL clause suitability is
still your responsibility. For more involved queries, write separate fixed SQL
alternatives or use the additional-review route. No generic composition is provided.

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
It inventories `.query`, `.execute`, `.unsafe` and same-named direct calls;
`--sink=name` adds application-specific call names. These are **driver candidates**,
not driver identity assertions: unrelated methods may also be reported. Unknown
computed calls are additional-review items. An exit code of 0 means no configured
failure, **not** no review work: exit 1 indicates a violation, or any additional-review
item with `--strict`; input/read/argument errors exit 2.

The audit recognizes named Serene imports (including aliases), literal tags,
immutable local variable chains, inline finite sort maps, binding and `.text`
extraction. It detects direct tag calls, SQL interpolation, addition, and common
`.join`/`.concat`/`.replace` constructions at known boundaries. Type assertions do
not establish provenance. Parse errors are violations.

The inventory is **file-local and deliberately incomplete**. It does not follow
cross-file exports, namespace imports, arbitrary wrappers, destructured/renamed
driver methods, dynamically loaded code, or generated code not supplied to the CLI.
Unresolved candidates are never ordinary; an undiscovered call has no finding at
all. Supply every relevant source file and inventory your application's execution
APIs; add custom sink names or retain manual review for other routes. Zero findings
is not a whole-application SQL safety claim. See [security boundary](docs/security.md).

## Public API

- `postgres`, `mysql`, `mssql`: literal tags returning opaque `Sql`.
- `sort`: restricted literal ordering returning opaque `Sort`.
- `orderBy(sql, choices, key)`: choose and append one static ordering.
- `bind(sql, params?)`: return `{ text, values, names, dialect }`.
- `review(value)`: runtime provenance level and reason code.
- `SereneError`: structured policy/binding failure.
- Optional `@mk3008/serene/audit`: `auditSource(source, filename?, { sinkNames? })`.

## Deliberate limits

The scanner skips quoted text, identifiers and comments with explicit dialect
rules. It preserves PostgreSQL casts/dollar quotes/nested comments, MySQL backticks
and line comments, and SQL Server brackets/system variables. It refuses unfinished
quotes/comments, mixed positional parameters, mode-dependent quoted backslashes
(PostgreSQL/MySQL), and MySQL executable/hint/nested comments. It does not attempt
complete dialect coverage. SQL Server local `@variables` are treated as binding
names; procedural batches should use the additional-review route.

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
