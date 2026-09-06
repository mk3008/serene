# Requested-name replacement verification

## Decision

Supersedes the conservative fixed-SQL rejection policy at `7c7b6e3`.
Construction provenance, SQL validity, and correct driver binding are separate duties.
The literal tag now preserves source without SQL validation; bind locates only
caller-supplied names. No runtime value is rendered into SQL.

| Boundary | Current behavior | Evidence |
| --- | --- | --- |
| Arrays, subscripts, JSON `?`, `?|`, `?&`, `#>`, `#>>`, `@>`, `<@`, `@?`, `@@` | Preserve syntax and lower requested names | Exact text and value-order assertions |
| Dollar quotes, explicit E strings, doubled quotes, nested/line comments | Shield common nonparameter occurrences | Same requested names inside and outside regions; no extra slots |
| Unspecified names and other colon uses | Preserve source, do not supply values | Prefix/Unicode boundary, cast and omitted-name cases |
| Native/generated marker collision | Reject for matching output contract only | Indexed, anonymous and at-named negative cases; PostgreSQL JSON positive cases |
| Hostile values or parameter-name syntax | Values stay separate; non-ASCII-identifier names fail | Existing four-style hostile corpus plus complex SQL and invalid-name cases |
| Interpolation, forged objects and arbitrary sort fragments | Still rejected | Existing runtime, type and source-audit regressions retained |
| SQL validity or unrecognized quote conventions | Not validated | Pass-through cases and documented shielding limits |

PostgreSQL syntax references checked:
[lexical structure](https://www.postgresql.org/docs/18/sql-syntax-lexical.html),
[JSON operators](https://www.postgresql.org/docs/18/functions-json.html).
Normal strings use standard-conforming escaping; see the security document for
unsupported shielding conventions. These references inform test inputs, not a
claim of comprehensive SQL parsing.

## Checks run

- `npm run check`: 57 tests passed, TypeScript checks and tooling syntax checks passed.
- `node tooling/cli.mjs --strict test/examples.ts`: three driver candidates ordinary.
- `npm pack`: built and extracted the distribution; imported the extracted runtime
  without installing its optional TypeScript peer. Four output contracts, arrays,
  JSON operator, ordered sorting and hostile-value separation passed.
- `git diff --check`: passed.

The previous suite had 76 tests. Its 26 blanket lexical rejection cases were removed
because that policy is explicitly withdrawn, and seven behavior/security tests were
added (many with multiple cases). The count reduction is not reduced security
coverage by itself: interpolation/provenance/sort negatives remain, and actual
output-marker collisions now have bind-time negative tests. Missing-name rejection
was replaced with explicit omitted/inherited-name behavior, not silently dropped.

No PostgreSQL server or native driver was available in this workspace; no live DB
execution is claimed. These checks establish replacement behavior and value/text
separation for the tested inputs, not universal driver mapping, application
correctness, absence of all SQL injection paths, or measured AI-review effectiveness.
The historical triage corpus and its evidence are unchanged.

## Review follow-up: conservative limits with easy equivalent spellings

Addresses [review comment 5557534143](https://github.com/mk3008/serene/pull/1#issuecomment-5557534143).
The permanent design now permits conservative restrictions with clear equivalent
spellings that preserve meaning, performance and native functionality. It does not
aim to accept every valid SQL spelling or justify silent rewriting of unsupported
syntax. Existing ARRAY/subscript/JSON positives are unchanged.

- Retain unconditional `--` line-comment handling. In all four output styles,
  supplied `id` for `SELECT 5--1, :id` fails with `UNUSED_PARAMETER`, including a
  case with a different parameter on the next line. `5 - (-1)` binds normally.
- Detect non-ASCII identifier-shaped dollar delimiters at the existing delimiter
  boundary and fail with `UNSUPPORTED_DOLLAR_QUOTE` plus its offset. This includes
  mixed ASCII/non-ASCII tags, unterminated bodies and an already-seen parameter.
  Canonical `$$`/ASCII tags work; lookalikes inside quotes/comments and identifiers
  are preserved. The new failure regression failed before the five-line guard was
  added, then passed without changing its expectations.
- Re-ran `npm run check`: 60 tests passed; type and tooling syntax checks passed.
- Rebuilt/extracted `npm pack` and imported its runtime without the optional
  TypeScript peer: four output styles, arrays/JSON, finite sorting, hostile-value
  separation, both review regressions and canonical ASCII dollar quoting passed.
- `git diff --check`: passed. No live DB execution or AI significance claim added.
