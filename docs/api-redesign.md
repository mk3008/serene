# SQL authoring and parameter output redesign

This PR follow-up changes the unpublished API. Reviewability and carrying SQL to
external tools are the goal. The public API owns constrained construction and
parameter output, not a database dialect, connection, mapper, MCP server or test
infrastructure.

## Migration

| Previous API | Current API |
| --- | --- |
| `postgres` literal + `bind(stmt, params)` | `sql` literal + `bind(stmt, params, 'indexed')` |
| `mysql` literal + `bind(stmt, params)` | `sql` literal + `bind(stmt, params, 'anonymous')` |
| `mssql` literal + `bind(stmt, params)` | Author `:name` with `sql`; `bind(stmt, params, 'at-named')` |
| `Dialect` and `BoundSql.dialect` | Removed; `ParameterStyle` describes output markers only |
| Converted text stored as statement | `Sql.sourceText` retains pre-lowering SQL; lowering occurs in `bind` |
| One completed sort choice | One key or a readonly key array, applied in supplied order |

`bind(stmt, params)` now defaults to named `:name` output. Never omit the explicit
style when migrating a positional driver. Repeated names share a slot for indexed
output, repeat values per occurrence for anonymous output, and deduplicate for named
outputs. The returned named `params` snapshot always has one entry per distinct name.
No arbitrary rendering callback, runtime SQL constructor or value-inlined debug SQL
is introduced. Source audit recognizes `sql`, aliases and inline whitelisted terms;
removed imports cannot establish ordinary construction under the new audit.

`sourceText` is the SQL body after JavaScript template escaping, with original
whitespace and named markers retained. An `orderBy` result includes the selected
static suffix; the original base object's source is unchanged. SQL and named values
can be taken separately to an external tool. Its actual parameter syntax and database
connection remain the application's concern. There is no DBeaver/MCP/mapper runtime
integration or compatibility claim.

## Necessary lexical boundary and compatibility cost

Correctly finding `:name` requires distinguishing SQL text from quotes and comments.
Removing a public `Dialect` does not make that requirement disappear. The redesign
uses one bounded lexical contract and records parameter spans once; output marker
selection does not alter lexing.

Supported: doubled single/double quotes, whitespace-followed `--` comments, ordinary
nonnested block comments and `::` casts. Rejected: quoted backslashes, alternative
quotes, executable/hint/nested comments, non-whitespace `--`, outside-quote backticks,
brackets, `#`, dollar forms and backslashes, plus noncanonical parameter markers.

Consequently, old positives such as dollar-quoted bodies, backtick/bracket identifiers,
nested comments and system variables are now explicit negative cases. This is a
conservative scope reduction, not equivalent support under renamed APIs. Do not strip
quoting or change SQL semantics merely to satisfy Serene. Keep such SQL on the raw
native-driver path with additional construction review. No grammar, schema, database
portability or universal lexical correctness is established by the ordinary label.

## Ordered finite sorting

Runtime input selects a subset of source-controlled sort keys and their order.
Unknown/non-string keys, duplicates, forged sorts and map accessors fail. An empty
array returns the base unchanged. All map entries are validated, even unselected ones.
A nonempty sort is appended once, before a statement terminator. Arbitrary expressions
and fragments remain excluded. The application owns clause placement, contradictory
column choices and deterministic tie-breaking. Complete ordering combinations need
not be enumerated.

## Raw SQL Rules v0.2 assessment

Reference: [released v0.2.0](https://github.com/mk3008/raw-sql-rules/blob/422721f6d4e29e1c81a92371dc5150611600897d/raw-sql-rules.md).
The unmerged v0.3 is not used as a conformance basis and the rules repository is not
modified.

| v0.2 boundary | Serene relationship |
| --- | --- |
| Contract 1: directly reviewable SQL, native execution | Literal SQL remains visible; application invokes its driver |
| Contract 2: application-owned concerns | No execution, connections, mapping, transactions or test infrastructure |
| Contract 3: runtime does not supply arbitrary syntax | Values bind separately; sorting selects and orders finite reviewed tokens |
| Default 1: dedicated authoritative source per statement | Application must put literals in dedicated source files; Serene cannot enforce project layout |
| Default 2: meaningful parameter names in review | Author `:name`; positional lowering stays below the review boundary |
| Default 3: inspectable current schema | Application-owned; not supplied by this library |
| Default 4: real database/driver verification path | Application-owned; Serene's unit suite does not fulfill it for an application |

Contract 3 explicitly permits reviewed application-controlled structural variation.
The ordered whitelist preserves that boundary; it is not treated as a rules violation.
This is a design compatibility assessment, not a certification that every application
using Serene satisfies all default requirements. In particular schema artifacts,
one-statement source ownership and actual DB tests still have to exist in the app.

## Validation and evidence boundary

The current checks cover all four output styles, repeated names, hostile values,
source preservation, binding validation, identity forgery, ordered/empty/invalid sort
selections, scope-aware audit regressions and negative TypeScript cases. The previous
DBMS-specific lexical positives are explicitly replaced by rejection regressions for
the documented narrower contract; they are not silently ignored.

Historical 40-case evidence remains pinned to
`b93e3d4a92df353cfdbec6154c0144739f6eb2e6`; its raw files and reproduction guard are
unchanged. Use the detached worktree instructions in the evaluation report. Do not
claim those frozen counts measure this redesigned API or improved AI defect recall.
No live DBeaver, MCP, Docker/database, mapper or AI significance experiment is claimed.

Verified for this follow-up:

- `npm run check`: 76 tests passed; strict type checks and tooling syntax checks passed.
- Strict source audit of `test/examples.ts`: three native-driver candidates ordinary.
- `npm pack` and an offline, scripts-disabled install: main runtime works without
  TypeScript installed, with all four output contracts and ordered sorting.
- With the optional TypeScript peer supplied: packed audit import, strict CLI smoke
  and packed consumer declarations (including negative type cases) passed.
