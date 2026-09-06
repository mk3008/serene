# Security and review contract

Serene separates **value binding**, **SQL construction provenance**, and **review
coverage**. They are distinct conditions.

1. With recognized literal tags, the SQL body comes from source text. `bind` never
   places values in SQL text. ORDER BY can only append a checked static sort token
   chosen from a finite map; the source audit requires that map at the call site.
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
runtime checks: missing parameters and unknown sort keys still fail at runtime.

## Threat examples

| Case | Result |
| --- | --- |
| User payload passed as a named value | Kept outside generated SQL text |
| `${input}` in a Serene tag | Type error, runtime error, source violation |
| `postgres(fabricatedTemplate)` | Source violation; some fabricated templates pass runtime checks |
| Shape/cast presented to `bind` | Runtime rejection; source cannot establish provenance |
| `db.query('SELECT ' + input)` | Source violation at candidate boundary |
| `db.query(unknownSql)` | Additional review |
| Local const alias of a candidate driver method | Violation or additional review; receiver/prebound SQL is not trusted |
| Unknown wrapper/mutable renamed function never configured | May be absent from inventory; manual coverage review required |
| Same binding `.text` with wrong `.values` | Not proven correct by source audit |
| `EXEC`/dynamic SQL inside the database using a bound value | Not protected from second-order SQL injection |
| Malicious dependency, eval, modified globals, hostile proxy traps | Outside threat model |
| Valid fixed SQL deleting the wrong tenant's data | Outside Serene's guarantee |

## Lexical restrictions

The implementation rewrites parameter tokens, not SQL syntax. Connection-dependent
backslash quoting is rejected in PostgreSQL/MySQL rather than guessed. PostgreSQL
E-string backslashes are also rejected deliberately, keeping one conservative rule
even across continued string literals. Use parameters for those values. Dollar-quoted
PostgreSQL bodies are copied unchanged and their internal placeholders are not bound.
MySQL executable comments and hints are rejected; normal comments are copied.

Do not pass rendered SQL to a different dialect, client-side formatter, unreviewed
SQL transpiler or another template composer. Use native parameter binding, matching
the returned convention. Review custom driver value serialization and database-side
dynamic SQL separately. Mutating values does not mutate SQL, but can change business
behavior; runtime `review` does not attest to the integrity of value contents.

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
