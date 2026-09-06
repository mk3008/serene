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
runtime checks: invalid supplied values, output-marker collisions and unknown sort keys still fail at runtime.

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

## Parameter replacement boundary

`sql` establishes construction provenance and stores fixed source; it does not parse
or validate SQL. `bind` snapshots own data properties, validates ASCII names, locates
only requested `:name` spans and rewrites those spans into a closed output contract.
Values never enter SQL text. Unspecified markers remain unchanged; omitted/inherited
names do not create slots. Unused supplied names still report likely caller mistakes.
Neither completeness nor success at the database is guaranteed.

The scanner shields doubled single/double/backtick quotes, PostgreSQL dollar quotes
and explicit `E` string escapes, line comments starting `--`, and nested block
comments. This prevents common accidental literal changes and extra anonymous slots.
All other characters pass through, including PostgreSQL arrays and JSON operators.
Existing markers are checked only against the selected output style when new markers
are emitted: `$number` with indexed, `?` with anonymous, `@name` with at-named.
This mechanical collision check prevents slot reuse/shifting; it is not SQL grammar
validation or a complete detector for every driver's native marker syntax.

Shielding is an authoring convention, not dialect inference. Plain quoted strings
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

## Review procedure

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
