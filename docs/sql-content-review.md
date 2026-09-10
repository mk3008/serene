# SQL-content review suggestions

The v0.4 content axis adds lightweight review suggestions to the existing
file-local audit. It inspects only successfully recognized fixed `sql` tags from
Serene. It does not inspect arbitrary strings, SQL files/migrations, ORM builders
or `sort` tags. Migrations should receive whole-change review.

A finding keeps its construction `level`, `code` and `detail`. When a content
heuristic matches it also carries `reviewSignals: [{ code, detail }]`. For example,
a tagged `DELETE FROM users` has `level: "ordinary"` and a separate
`SQL_DELETE_WITHOUT_WHERE` review suggestion. No signal means no heuristic matched;
it is not approval of SQL meaning, authorization, performance or binding use.

## Small heuristic set

| Code | Approximate trigger |
| --- | --- |
| `SQL_DROP` / `SQL_TRUNCATE` / `SQL_RENAME` | Standalone keyword anywhere in the SQL text |
| `SQL_CREATE_TEMP` | CREATE followed by TEMP/TEMPORARY, optionally GLOBAL/LOCAL |
| `SQL_SELECT_WITHOUT_WHERE` | SELECT without an apparent WHERE before the next operation/semicolon |
| `SQL_UPDATE_WITHOUT_WHERE` | UPDATE without an apparent WHERE before the next operation/semicolon |
| `SQL_DELETE_WITHOUT_WHERE` | DELETE without an apparent WHERE before the next operation/semicolon |
| `SQL_UNRESOLVED_CTE` | After WITH, an AS-opened body has a start other than SELECT/INSERT/UPDATE/DELETE, or no recognizable start |
| `SQL_DATA_MODIFYING_CTE` | After WITH, an AS-opened body begins with INSERT/UPDATE/DELETE |

Rules are case-insensitive and deduplicated by code per finding. DROP, TRUNCATE
and RENAME intentionally also match comments and literals. For the other rules,
a small text mask removes common single/double quotes and line/block comments,
so a comment or literal WHERE does not normally clear an unrestricted operation.
SELECT/UPDATE/DELETE/INSERT words and semicolons delimit approximate regions;
this does not determine statement type, nested query scope or actual row limits.

False positives are intentional: SELECT 1, aggregate queries, nested queries,
keywords used as names, and legitimate maintenance SQL can all deserve a look.
An outer INSERT/UPDATE/DELETE following a SELECT CTE does not trigger the CTE
rule. It looks for `AS (` followed by DML, also in later CTE definitions; optional
MATERIALIZED/NOT MATERIALIZED and extra opening parentheses are tolerated. This
is a structural candidate, not proof of a CTE definition.

The same body-start scan emits `SQL_UNRESOLVED_CTE` for other/unclear starts,
including VALUES, TABLE, MERGE or a nested WITH. These may be valid SQL; they
exceed this small recognizer. Multiple bodies can produce both CTE signal codes.
Simple SELECT bodies acquire neither CTE signal, although other content rules
still apply. No closing-parenthesis matching is added: SELECT-starting complex
bodies and syntax with no recognized AS opener are not comprehensively referred.
Absence of a CTE signal does not prove that its structure was understood.

Conversely,
WHERE true can avoid the absence signal despite imposing no useful restriction.
Nested comments, dollar/backtick/bracket quoting, escape conventions, procedural
SQL and other dialect details are not fully interpreted. Signals can be missed
or added in those forms. No full SQL parser or DBMS-specific semantic layer is
introduced. Review the SQL; do not add a token WHERE merely to clear a signal.

## Delivery and gates

Signals follow existing recognized binding, const-alias, finite-ordering and
execution-text provenance, including bounded native QueryConfig. Inline
QueryConfig propagates the `text` receiver's content signals; values do not define
executed SQL. Unsupported flow retains its construction referral, while any
recognized tag at its definition can still carry its own content signals.

`--actionable-only` retains signaled findings even with `level: "ordinary"`.
`executionSiteCounts` continues to count construction levels only. The separate
`contentReviewExecutionSiteCount` counts signaled candidate executions once each;
it overlaps construction counts and is not a count of all SQL or of all signals.
Definition/binding/execution findings can repeat the same signal for navigation.

Content suggestions do not affect exit status in either normal or `--strict`
mode. They remain visible in both full and actionable output, including tags
without a recognized execution. Construction violations still exit 1; construction
review-required findings additionally exit 1 with `--strict`. Content suggestions
are requests for additional review, not errors or required code changes. Serene
does not record human approvals or introduce an exception manifest.

Source/diff filters retain signaled construction bodies. Signals propagated from
a definition outside a requested range still prevent suppression of its recognized
execution function. Lost/gained filter eligibility preserves all diff edits and
reports navigation to affected functions, including unchanged execution sites.
The historical reason `ordinary-set-changed` means filter eligibility changed;
it need not mean the construction `level` changed. Unflagged construction remains
eligible under the existing stricter syntax and freshness checks.

These filters remain specialized review delivery tools. An unfiltered path is
still required for general SQL-meaning, authorization and driver-binding review.
This feature does not replace that review or expand runtime guarantees.
