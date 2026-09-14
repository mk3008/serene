# SQL-content review suggestions

The v0.4 content axis adds lightweight review suggestions to the existing
file-local audit. It inspects only successfully recognized fixed `sql` tags from
Serene. It does not inspect arbitrary strings, SQL files/migrations, ORM builders
or `sort` tags. Migrations should receive whole-change review.

A finding keeps its construction `level`, `code` and `detail`. When a content
heuristic matches it also carries `reviewSignals: [{ code, detail, priority? }]`. For example,
a tagged `DELETE FROM users` has `level: "ordinary"` and a separate
`SQL_DELETE_WITHOUT_WHERE` review suggestion. No signal means no heuristic matched;
it is not approval of SQL meaning, authorization, performance or binding use.

## Small heuristic set

| Code | Approximate trigger |
| --- | --- |
| `SQL_DROP` / `SQL_TRUNCATE` / `SQL_RENAME` | Standalone keyword anywhere in the SQL text |
| `SQL_PROCEDURAL_BODY` | Statement-entry DO with quoted code, or CREATE / ALTER FUNCTION, PROC/PROCEDURE or TRIGGER; elevated priority |
| `SQL_ROUTINE_CALL` | Statement-entry CALL / EXEC / EXECUTE (excluding EXECUTE AS); elevated priority |
| `SQL_PERSISTENT_DDL` | CREATE / ALTER of TABLE, VIEW, FUNCTION, PROC/PROCEDURE or TRIGGER; elevated priority |
| `SQL_TEMP_DDL` | Statement-entry `ALTER TABLE pg_temp.<fixed identifier>`; advisory |
| `SQL_CREATE_TEMP` | CREATE followed by TEMP/TEMPORARY, optionally GLOBAL/LOCAL |
| `SQL_SELECT_WITHOUT_WHERE` | SELECT without an apparent WHERE before the next operation/semicolon |
| `SQL_UPDATE_WITHOUT_WHERE` | UPDATE without an apparent WHERE before the next operation/semicolon |
| `SQL_DELETE_WITHOUT_WHERE` | DELETE without an apparent WHERE before the next operation/semicolon |
| `SQL_UNRESOLVED_CTE` | After WITH, an AS-opened body has a start other than SELECT/INSERT/UPDATE/DELETE, or no recognizable start |
| `SQL_DATA_MODIFYING_CTE` | After WITH, an AS-opened body begins with INSERT/UPDATE/DELETE |

Rules are case-insensitive and deduplicated by code per finding. DROP, TRUNCATE
and RENAME intentionally also match comments and literals. The DROP in a recognized
`CREATE TEMP[ORARY] TABLE ... ON COMMIT DROP` lifecycle clause (before CTAS `AS`)
is excluded by occurrence, not by clearing all DROP signals in TEMP SQL. Other
DROP occurrences, including comments/literals, remain review suggestions. This
bounded recognizer masks common quotes/comments and recognizes statement starts;
unrecognized syntax may still receive `SQL_DROP`. It is not a general DDL parser.
For the other rules,
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

## Persistent definitions on runtime paths

`SQL_PERSISTENT_DDL` has `priority: "elevated"`. The procedural-body and routine-call signals also carry elevated priority. Other
signals, including `SQL_CREATE_TEMP` and `SQL_TEMP_DDL`, omit `priority`, which means advisory. Priority expresses review
urgency, not a construction violation, SQLi diagnosis or mandatory code change.
The review question is: **Why is persistent database definition happening on a
runtime SQL path?** A fixed definition still has ordinary construction provenance.

One generic code covers TABLE, VIEW, FUNCTION, PROC/PROCEDURE and TRIGGER after
CREATE or ALTER. CREATE optionally accepts OR REPLACE / OR ALTER and UNLOGGED;
MATERIALIZED VIEW is also recognized. Common comments/quotes are masked using the
existing content mask; shapes can match anywhere in the remaining text and across
multiple statements, once per code. These are keyword candidates, not validation
of legal modifier/object combinations. Other object kinds (such as INDEX, SCHEMA
or TABLESPACE), intervening dialect clauses (such as MySQL DEFINER), unsupported
quoting and procedural syntax are outside this bounded rule.

CREATE TEMP[ORARY], optionally GLOBAL/LOCAL, retains `SQL_CREATE_TEMP` without
acquiring elevated priority from that creation. A separate persistent definition
in the same text still elevates. No catalog or lifetime tracking is performed:
unqualified ALTER TABLE on an existing temporary table and CREATE TABLE with a
SQL Server `#` name still receive the elevated signal.

Issue #35 adds one local PostgreSQL exception: statement-entry
`ALTER TABLE pg_temp.name ...` or `ALTER TABLE pg_temp."name" ...` emits advisory
`SQL_TEMP_DDL` instead. The unquoted schema token is case-insensitive; whitespace
around the dot and doubled quotes inside the table identifier are accepted.
Unquoted table names use ASCII letters/underscore followed by letters, digits,
underscore or dollar sign. Only that ALTER occurrence is excluded: another
persistent definition in the same tag still emits elevated `SQL_PERSISTENT_DDL`.

This relies on PostgreSQL's explicit [current-session temporary schema alias](https://www.postgresql.org/docs/18/runtime-config-client.html#GUC-SEARCH-PATH),
not prior CREATE statements, search_path, internal `pg_temp_3` names or catalog
inspection. ONLY / IF EXISTS, quoted schema tokens, intervening comments and
other DDL families keep the conservative fallback. Entry means the beginning of
the text or immediately after an unquoted semicolon, allowing whitespace only.
A local lexical pass shields quoted text and nested comments from introducing
false entries; it does not inspect procedural control flow. Tags containing raw
backslashes retain the old elevated fallback rather than interpreting JavaScript
escapes or SQL escape conventions. SQL validity remains the caller's duty.

TEMP does not guarantee acceptable locking, resource usage, authorization or
business behavior, and this signal does not imply ON COMMIT DROP was specified.

CALL and SELECT function invocation do not trigger this rule. Definition bodies
are not parsed as PL/pgSQL, T-SQL or MySQL stored programs; incidental existing
heuristics within them do not establish coverage or approval. The separate routine-execution rule below refers EXEC/EXECUTE without claiming
whether it is a fixed routine or dynamic SQL. Database-side/second-order SQL
construction remains outside the binding guarantee.

Coverage stays at recognized fixed Serene tags and their existing propagated
paths, including definitions without a discovered execution. The audit cannot
prove that a candidate is executed repeatedly or distinguish migration code by
intent. It neither scans standalone migrations nor requires them to adopt Serene.

## Procedural containers and explicit execution

Issue #32 adds two separate reasons for elevated review. Neither proves that code
is procedural, unsafe, read-only, deterministic or bounded:

- `SQL_PROCEDURAL_BODY`: a routine/trigger definition or anonymous code container
  merits inspection of its body and effects. CREATE FUNCTION/PROCEDURE/TRIGGER
  normally carries both this signal and `SQL_PERSISTENT_DDL`. SQL-language functions,
  external routines, single-statement triggers and ALTER of routine attributes may
  also be referred; language, body complexity and presence are not determined.
- `SQL_ROUTINE_CALL`: an explicit routine or database-side execution form delegates
  behavior beyond the call site. The signal deliberately does not distinguish
  fixed procedure calls, prepared statements or dynamic execution. It is a review
  opacity signal, not an injection finding. CALL/EXEC do not become persistent DDL.

| Dialect / form | Bounded coverage |
| --- | --- |
| PostgreSQL DO | DO followed by a single-, E- or ASCII dollar-quoted code body; optional LANGUAGE before the body (and a trailing LANGUAGE does not interfere) |
| PostgreSQL routine/trigger definition | CREATE / ALTER FUNCTION, PROCEDURE or TRIGGER; optional CREATE OR REPLACE |
| SQL Server | CREATE OR ALTER PROC/PROCEDURE, FUNCTION or TRIGGER and ALTER equivalents; explicit EXEC/EXECUTE including variable targets, return assignments, dynamic strings and sp_executesql |
| MySQL / MariaDB | Direct CREATE FUNCTION/PROCEDURE/TRIGGER (also OR REPLACE where supported), ALTER equivalents, CALL and EXECUTE entry forms |
| CALL | Explicit statement-entry invocation, including schema-qualified/quoted targets |

Only the beginning of SQL text or the text after an unmasked semicolon is an entry.
Common comments may precede it. A separate, small lexical mask shields comments,
single/E strings, ASCII dollar-quoted bodies and double/backtick/bracket identifiers
before looking for entries. It does not parse body internals. Plain dollar-quoted
SELECT text, quoted CALL/EXEC/DO words, ordinary built-ins and function-style SELECT
calls do not acquire these signals. BEGIN/END and transaction keywords alone are
not evidence. EXECUTE AS context switching is excluded from the invocation rule.

Known gaps are intentional: no control-flow traversal, statement discovery after
BEGIN/IF or a newline without a semicolon, implicit routine calls, client GO or
DELIMITER processing, MySQL DEFINER clauses/executable comments, non-ASCII dollar
tags, nested comments, or complete dialect-specific quoting/escape handling.
Semicolons in unquoted routine bodies can expose additional invocation candidates;
this is incidental coverage, not procedural analysis. Valid unsupported forms may
have no new signal. In MySQL a DO string expression can also match the PostgreSQL
container shape; no dialect inference is attempted. Source is inspected using the
existing raw-template convention, not by evaluating JavaScript escapes.

The separate mask leaves #31's persistent-DDL rule and all previous content rules
unchanged. Their broader heuristics can still match inside quoted procedural text;
absence of any signal never approves a body. Recognized definitions without an
execution candidate are retained too. No standalone migration scanning is added.

Syntax references: [PostgreSQL DO](https://www.postgresql.org/docs/18/sql-do.html),
[SQL Server CREATE PROCEDURE](https://learn.microsoft.com/en-us/sql/t-sql/statements/create-procedure-transact-sql?view=sql-server-ver17),
[SQL Server EXECUTE](https://learn.microsoft.com/en-us/sql/t-sql/language-elements/execute-transact-sql?view=sql-server-ver17),
and [MySQL CREATE TRIGGER](https://dev.mysql.com/doc/refman/8.4/en/create-trigger.html).
These are recognizer regression cases, not cross-DBMS execution certification.

## Delivery and gates

Signals follow existing recognized binding, const-alias, finite-ordering and
execution-text provenance, including bounded native QueryConfig. Inline
QueryConfig propagates the `text` receiver's content signals; values do not define
executed SQL. Unsupported flow retains its construction referral, while any
recognized tag at its definition can still carry its own content signals.

`materializeTemp` inherits body signals and adds `SQL_CREATE_TEMP` once. Its fixed
`ON COMMIT DROP` wrapper adds no destructive signal. This does not suppress DROP,
data-modifying CTE or other suggestions inherited from the body. The TEMP signal
remains advisory; elevated priority comes only from a matching DDL shape in the
body, not from this wrapper.

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

For explicit external SQL, source literals and no-substitution templates passed to
recognized `externalSql` calls (including local const aliases) reuse these signals.
They remain `review-required` / `EXTERNAL_SQL` regardless of signals or successful
binding. Runtime-loaded text is unavailable to source audit; runtime `review()`
reports identity only and does not run content heuristics.
