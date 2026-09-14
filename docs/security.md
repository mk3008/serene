# Security and review contract

Serene separates **value binding**, **SQL construction provenance**, and **review
coverage**. They are distinct conditions.

1. With recognized literal tags, the SQL body comes from source text. `bind` never
   places values in SQL text. ORDER BY can only append checked static sort terms
   chosen and ordered by keys from a finite map; the source audit requires that map at the call site.
2. Identity-backed runtime objects cannot be forged using object shape or a type
   assertion. This is an accidental-misuse boundary, not a sandbox against arbitrary
   code running inside the same process. Fabricated template arrays remain possible;
   direct tag calls are source violations.
3. File-local source inspection recognizes a small set of paths and refuses to
   establish provenance for unknown paths. It does not discover every driver call.
   Coverage of source files and execution entry points remains an application concern.

The ordinary label only reduces scrutiny of recognized construction mechanics.
It does not discharge review of the SQL, parameters' business meaning, authorization,
or correct driver binding. An ordinary source finding is conditional on successful
runtime checks: invalid supplied values and unknown sort keys still fail at runtime;
output-marker collisions fail only on explicit positional-lowering paths.

The independent [SQL-content axis](sql-content-review.md) can suggest review even
for ordinary construction. These approximate signals neither reject runtime SQL
nor establish SQL correctness or SQLi freedom. No signal means no heuristic
matched, not that the SQL has been approved. Signaled paths remain visible in
specialized source/diff filtering. Persistent-DDL candidates carry elevated review
priority even with ordinary construction; this does not prove object lifetime or
validate procedure bodies. Explicit bounded PostgreSQL `ALTER TABLE pg_temp.<name>`
receives an advisory temporary-DDL signal while remaining visible for review;
this does not certify its operational effects. Separate procedural-container and CALL/EXEC execution
signals keep recognized review-heavy paths visible; they do not identify dynamic
SQL or prove body safety. CALL/function invocation is not a persistent definition,
and SELECT-style function calls remain outside the invocation recognizer.

## Threat examples

| Case | Result |
| --- | --- |
| User payload passed as a named value | Kept outside generated SQL text |
| `${input}` in a Serene tag | Type error, runtime error, source violation |
| `sql(fabricatedTemplate)` | Source violation; some fabricated templates pass runtime checks |
| Shape/cast presented to `bind` | Runtime rejection; source cannot establish provenance |
| `db.query('SELECT ' + input)` | Source violation at candidate boundary |
| `db.query(unknownSql)` | Additional review |
| Local const alias of a candidate driver method | Violation or additional review; receiver/prebound SQL is not trusted |
| Unknown wrapper/mutable renamed function never configured | May be absent from inventory; manual coverage review required |
| Same binding `.text` with wrong `.values` | Not proven correct by source audit |
| `EXEC`/dynamic SQL inside the database using a bound value | Not protected from second-order SQL injection |
| Malicious dependency, eval, modified globals, hostile proxy traps | Outside threat model |
| Valid fixed SQL deleting the wrong tenant's data | Outside Serene's guarantee |

## Passthrough and positional lowering

`sql` stores fixed source with construction provenance; it does not validate SQL.
Both binding paths validate supplied own ASCII names and data properties, reject
undefined/accessor values, ignore inherited properties and snapshot values separately.
Values are never rendered into SQL text. SQL completeness and native-driver binding
correctness remain application responsibilities.

With the third argument omitted or `undefined`, `bind` is passthrough. It returns
`text === sourceText` without running the scanner, locating names, checking usage,
or detecting collisions. `params` contains all supplied own keys; `names`/`values`
follow their own-property order once per key, regardless of SQL occurrences.
Native `@id`, `[customer:id]`, `$100.00`, `@@ROWCOUNT`, any parameter-like text and
unsupported quote forms are preserved. This says nothing about SQL validity; the
application registers named values with its native driver. Extra/missing names are
not diagnosed on this path. Unsupported output-style strings fail rather than
silently selecting passthrough.

Only explicit `indexed` or `anonymous` lowering scans for requested `:name` spans.
Unspecified names remain unchanged and unused supplied names fail. The scanner
shields common quotes/comments, ASCII dollar quotes and explicit `E` string escapes.
Arrays/subscripts/JSON operators remain supported. Existing `$number` (indexed) or
`?` (anonymous) conflict with generated markers and fail when bindings are emitted.
No `@name` conversion or collision check remains.

The following scanner conventions concern lowering and the separate `orderBy`
terminator check, not passthrough binding:

- Dollar quoting uses `$$` or ASCII tags matching `[A-Za-z_][A-Za-z0-9_]*`.
  Non-ASCII identifier-shaped delimiters fail with `UNSUPPORTED_DOLLAR_QUOTE` and
  an offset. Use `$body$` instead of `$日本$`; do not silently rewrite its body.
- Every `--` starts a line comment. Use `x - (-1)` instead of adjacent `x--1`.
  Lowering `SELECT 5--1, :id` with supplied `id` fails with `UNUSED_PARAMETER`.
- `orderBy` retains its existing scanner/terminator checks before a finite suffix
  is appended. Choosing passthrough later does not bypass that construction check.

On the lowering path, shielding is an authoring convention, not dialect inference. Plain quoted strings
use doubled delimiters, with backslashes ordinary; PostgreSQL
`standard_conforming_strings=on` matches this convention. `E` strings recognize
backslash escapes. Continuation of escape strings, alternative quoting, executable
comment bodies, MySQL hash comments and SQL Server bracket identifiers are not fully
interpreted. Brackets must stay ordinary characters to allow parameters inside array
expressions. Requested names in such ambiguous regions can be replaced or missed;
validate generated SQL and slot/value pairing with the target driver. An unrecognized
region can still contain a native marker the scanner cannot detect. No universal
mapping/semantic correctness is promised for those forms. A quote/comment extending
to EOF is preserved; SQL validity belongs to the database.

Relaxing fixed-source rejection does not permit value interpolation, dynamic marker
syntax, arbitrary fragments or forged provenance. The remaining negative tests cover
those boundaries. Correct value-to-placeholder mapping remains a separate review and
integration-test duty, even though values never become SQL text.

Do not pass output to a client-side formatter, unreviewed transpiler or another
composer. Use native parameter binding matching the chosen marker contract. Review
custom value serialization and database-side dynamic SQL separately. The mutable
values array and shallow value contents can change independently of the named
snapshot; `review` attests to identity, not value integrity or correct driver pairing.

The sort grammar is intentionally not a general identifier or expression builder.
Correct placement of appended ORDER BY remains a SQL authoring duty. Fixed multi-
statement text is not universally prohibited; suffix sorting rejects statement
terminators to avoid accidentally applying ordering to another statement.

## External SQL

`externalSql(text)` accepts a primitive string and creates an immutable,
identity-backed `ExternalSql`, distinct from `Sql`. `bindExternal` accepts only
that unbound identity and shares the exact binder/scanner with `bind`. Its
`BoundExternalSql` exposes the same native-driver text/names/values/params shape.
It preserves the existing shallow snapshot contract: the object, named snapshot
and names are frozen, while the driver values array and contained objects remain
mutable. It does not promise deep immutability or correct driver pairing.

Runtime `review` returns `review-required` / `EXTERNAL_SQL` before and after
binding. Neither object is registered as ordinary. Shapes, copies, prototypes and
type assertions cannot establish runtime identity. Source-only composition
(`orderBy`, `materializeTemp`) and `bind` reject external objects, including casts.
There is no approval option and no implicit trust from storage location, hash,
revision or signature. Such evidence and authorization belong to the application.
Destructive, procedural or semantically incorrect SQL can still bind successfully.

The source audit recognizes canonical named imports and immutable local aliases
of `externalSql` / `bindExternal` as review-required. It does not interpret string
validation as provenance, and strict mode continues to fail. Literal strings and
no-substitution templates (including local const aliases) passed to `externalSql`
receive existing content signals, independently of provenance. Runtime-loaded
text cannot be inspected by source audit; runtime `review` remains identity-only.
Unsupported source flows stay unresolved under existing file-local coverage rules.
External paths stay visible in construction source/diff filtering.

## Review procedure

### TEMP materialization

`materializeTemp(body, 'name')` accepts only an existing unbound, identity-backed
`Sql`. It prepends a fixed PostgreSQL `CREATE TEMPORARY TABLE "name"` /
`ON COMMIT DROP` / `AS` wrapper with a newline before the unchanged body. No runtime
values, prefix/suffix options or SQL fragments are accepted. Bind once afterward.
Plain strings, extracted `sourceText`, casts, copied shapes and `BoundSql` do not
establish runtime identity.

Names must begin with an ASCII letter/underscore and contain only ASCII letters,
digits/underscores, up to 63 characters. Quoting preserves case; no schema paths
are accepted. Runtime checks cannot distinguish a valid dynamic string from a
literal. Source audit therefore requires a direct string literal at the call site
(parentheses allowed); even const name aliases remain unresolved. Recognized
canonical import aliases and immutable local API/body aliases follow the existing
file-local rules. Unknown imports/helpers, mutable flows and type assertions are
not promoted. Runtime `review` alone does not establish source closure or human
approval.

The body guard rejects unquoted statement terminators, including a trailing `;`.
It shares the existing scanner's common quotes, nested block comments, line
comments, ASCII dollar quotes and E-string conventions. Unlike the general
scanner, backticks are not quotes for this PostgreSQL operation. PostgreSQL
`standard_conforming_strings=on` is required. Unsupported non-ASCII dollar tags
fail. No SQL is trimmed, split or regenerated; incomplete SQL may still reach the
database. The application must supply a query suitable for CTAS, review functions
and CTE side effects, and use matching native parameter binding. A genuine `Sql`
does not prove SELECT semantics, completeness or business safety.

Create and consume the relation on the same checked-out connection inside an
explicit transaction. `ON COMMIT DROP` removes it at commit; rollback undoes its
creation. Connection/transaction ownership, resource usage, name collisions and
authorization remain external responsibilities. There is no automatic drop/retry
or `IF NOT EXISTS` fallback. Use `orderBy` on the body before materializing if needed.
See [PostgreSQL CTAS](https://www.postgresql.org/docs/18/sql-createtableas.html).

Audit propagates body content signals and adds `SQL_CREATE_TEMP`; it does not
classify the generated lifecycle clause as destructive DROP. TEMP paths remain
visible in actionable output and source/diff filtering, without changing strict
exit status. See [content review](sql-content-review.md). Runtime semantics and
source closure are tested separately; `npm run test:postgres` is the real-database
transaction/binding regression run by Verify CI.

### Application review

Run source inventory for all changed application files and any call-site files they
affect. Verify that candidate names cover the native execution APIs in the application.
Review violation findings and additional-review items; do not treat an empty report
as proof of coverage. For ordinary findings, inspect SQL meaning, business parameter
mapping and actual native driver use. Record exceptions in the application's normal
review workflow rather than adding an unsafe Serene constructor.

See [coverage evidence](review-coverage.md) for measured challenge-set misses and
false candidates. Local alias discovery improves inventory, but never proves driver
identity or upgrades aliases to ordinary. General code review must retain ordinary
construction sites: wrong values, authorization defects and database-side dynamic
SQL remain possible there.

The optional [pre-exposure filter](pre-exposure-filter.md) can suppress recognized
construction-only functions before model delivery in a specialized construction
review. It checks full source, revision and range agreement against host-owned
context. It does not verify Git state or host honesty, and stale/unsupported content
stays visible. This omission must not be applied to general, authorization,
SQL-meaning or driver-binding review. The host owns interception of source-bearing
tools and retention of an unfiltered path for those review scopes.

The [diff companion](diff-filter.md) checks both full file versions and complete
paired edit ranges before suppressing changed source. Only corresponding ordinary
construction-only functions can compress. Lost/gained ordinary recognition keeps
all edits visible and reports side-specific follow-up navigation, including affected
execution sites outside the diff. Every input edit remains represented; a marker
must never be displayed as no change. This does not authenticate Git revisions,
decode a patch or establish general PR-review coverage.
