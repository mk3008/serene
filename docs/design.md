# Design decision and research provenance

## Goal

Give raw SQL a narrow review identity while keeping native drivers and SQL itself
visible. Do not rebuild Ashiba, Dapper or a query builder. Initial acceptance covers
literal construction, binding conventions, finite sorts, mechanical triage and clear
negative cases; it does not include exhaustive program analysis or live SQL validation.

## Conservative authoring limits

Accepting every valid SQL spelling is not a goal. A conservative restriction is
acceptable when a clear, easily reviewed equivalent preserves meaning, performance
and useful database functionality. Do not impose unnatural rewrites or functional
loss on ordinary native features such as PostgreSQL arrays, subscripts and JSON
operators. Preserve reviewable fixed SQL and value separation rather than growing a
complete dialect parser. Where ambiguity warrants a narrow guard, fail closed or
use the additional-review route; do not knowingly reinterpret unsupported syntax
and silently rewrite its contents.

For example, use `x - (-1)` rather than adjacent `x--1`, and use ASCII dollar-quote
tags such as `$body$` rather than `$日本$`. The positional-lowering scanner keeps unconditional `--`
line-comment handling and rejects detected non-ASCII dollar delimiters; it does not
implement MySQL whitespace rules or a universal dollar-quote parser.

## Smallest useful design

One package has an independent runtime entry and an optional source-audit entry.
The runtime consists of a requested-name scanner, identity-backed objects and a
binder. The audit reuses the TypeScript parser/binder rather than inventing a JS
parser or depending on a full lint framework. TypeScript is the sole dev dependency
and an optional peer for tooling, never loaded by the runtime entry.

The `sql` tag has no interpolated values or fragments. Named values are explicit at
binding. ORDER BY is the sole composition operation and accepts a small sort grammar.
No AST, generated artifacts, arbitrary renderer strings, dialect abstraction, unsafe
constructor, plugin framework or driver execution adapter is introduced.

Static and runtime checks complement one another. JavaScript cannot authenticate a
template literal at runtime; TypeScript brands alone can be asserted away. Runtime
object identity plus conservative source provenance avoids claiming either mechanism
solves the complete problem. Unknown source flow is additional review, not ordinary.

## Current authoring and execution boundary

Author native named SQL directly when the driver supports it. `bind(stmt, params)`
preserves SQL exactly and associates a named snapshot; it never scans SQL or checks
parameter usage/collisions. SQL Server can use `@id`, bracket identifiers, money
literals and system variables without Serene interpreting them. Parameter keys remain
validated own ASCII names; values remain separate. Native binding correctness belongs
to the driver, database and application.

Use `:name` authoring notation only when explicit `indexed` or `anonymous` lowering
is needed. These are the only `ParameterStyle` values; no compatibility aliases remain
for the unpublished `named`/`at-named` API. The lowering scanner searches supplied
names and shields common quoted/comment regions. Output-marker collisions and narrowly
detected unsupported dollar delimiters fail closed. Missing-name completeness remains
outside Serene; unused supplied names fail only on the lowering path. A passthrough
snapshot follows supplied own-property order, not SQL occurrence order.

`orderBy` is a separate construction operation: its existing terminator scan and
finite-sort restrictions remain in force before any binding mode is selected.

Finite `Sort` tokens can be selected and ordered by a runtime key array. This keeps
structural choices application-owned without enumerating all complete ORDER BY
permutations. Only the whitelist keys and their order are runtime-controlled.

## Ashiba inputs

Consulted local checkout `96aef00f3c8e6803aa481a6476ba255fbfd487be` and verified the
current compiler through GitHub (blob `587f8130a13f3a977a4e40c00e874c32a7d8bf6b`).
Remote HEAD observed on 2026-09-06: `af90dc5db236d5894f264bc67a6c6c8d7bb24ec2`.
Ashiba was read only. Its API/archive status is not a dependency of this design.

- [Compiler](https://github.com/mk3008/ashiba/blob/af90dc5db236d5894f264bc67a6c6c8d7bb24ec2/packages/named-parameters/src/compiler.ts): lexical skipping and lowering only placeholders.
- [Binder](https://github.com/mk3008/ashiba/blob/96aef00f3c8e6803aa481a6476ba255fbfd487be/packages/named-parameters/src/index.ts): strict named-set validation, own-property checks and values kept separate.
- [Compiler tests](https://github.com/mk3008/ashiba/blob/96aef00f3c8e6803aa481a6476ba255fbfd487be/packages/named-parameters/tests/compiler.test.ts): repeated names, casts, quoted text, dollar quotes and nested comments.
- [Binding tests](https://github.com/mk3008/ashiba/blob/96aef00f3c8e6803aa481a6476ba255fbfd487be/packages/named-parameters/tests/named-parameters.test.ts): hostile values, missing/unused names and occurrence ordering.
- `docs/evaluations/named-parameter-ownership/{NAMED_PARAMETER_DECISION,DRIVER_PARAMETER_CAPABILITIES,MAINTENANCE_SURFACE}.md` in that local snapshot: common name-set validation has value beyond merely renumbering placeholders. Those were historical experiments, not Serene integration results.

Serene independently reimplements/adapts those algorithms and regression scenarios;
no package import, fork, compatibility layer or copied generated metadata is used.
The original MIT copyright is retained. The initial implementation added explicit dialect lexing,
closed lexical-boundary errors, conservative quote restrictions, strict undefined/
accessor rejection, runtime provenance, source audit and finite ordering. The current redesign replaces dialect validation with requested-name replacement; see [API redesign](api-redesign.md).

Primary lexical references checked:

- [PostgreSQL lexical structure](https://www.postgresql.org/docs/current/sql-syntax-lexical.html)
- [MySQL string literals](https://dev.mysql.com/doc/refman/8.4/en/string-literals.html)
- [SQL Server nested block comments](https://learn.microsoft.com/en-us/sql/t-sql/language-elements/slash-star-comment-transact-sql?view=sql-server-ver17)

## Requirements added for review value

Undefined supplied binding rejection, lowering-only unused-parameter rejection,
explicit unknown-sort errors, structured diagnostic locations/codes, and an optional
strict CLI gate are included. They expose common mistakes without adding execution
or schema responsibilities.

Future proposals, not implemented: application-specific sink coverage manifests,
selected real-driver integration probes, and measured review effort using a real
application. The [Issue #8 ownership decision](sql-layout.md) retains layout-neutral,
file-local provenance; imported paths remain explicit additional review. Bounded
cross-file recognition can be reconsidered with concrete review-work and coherence
evidence. ESLint integration and C#/Bun adapters need a separate value/cost decision.
Do not add them solely for feature parity.
