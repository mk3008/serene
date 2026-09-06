# SQL authoring and parameter output redesign

This PR follow-up changes the unpublished API. Reviewability and carrying SQL to
external tools are the goal. The public API owns constrained construction and
parameter output, not a database dialect, connection, mapper, MCP server or test
infrastructure.

## Migration

This API is unpublished; compatibility aliases are deliberately removed.

| Previous use | Current use |
| --- | --- |
| `named` default or explicit `named` | Omit the style for true passthrough; no SQL usage checks |
| `:id` lowered with `at-named` | Author native `@id` and omit the style |
| `indexed` | Keep `:name` notation and explicitly request `$1` lowering |
| `anonymous` | Keep `:name` notation and explicitly request `?` lowering |
| `ParameterStyle` with four members | Only `indexed | anonymous` |
| DBMS tags / `Dialect` | Still removed; use literal-only `sql` |

`bind(stmt, params)` or an explicit `undefined` third argument preserves SQL text
exactly. No `passthrough` string enum member is introduced. Removed `named` and
`at-named` strings are type errors and runtime `PARAMETER_STYLE` errors.

Passthrough associates fixed SQL with a snapshot of all supplied own data properties.
It does not parse `@name`/`:name`, check completeness/unused names, or detect collisions.
`names`/`values` follow supplied own-property order, once per key; they do not describe
SQL occurrence order. Register them with the native named binding interface. Both
paths retain ASCII-key validation, undefined/accessor rejection, immutable snapshots,
shallow values, and provenance checks. Inherited properties are ignored.

SQL Server examples now author `@id`, `[customer:id]`, `$100.00` and `@@ROWCOUNT`
directly. Passthrough requires no lexical interpretation of these forms. Meaningful
native named binding takes precedence over imposing Serene-specific SQL notation.

## Positional lowering only

Only `indexed`/`anonymous` invoke requested-name replacement of `:name` spans.
Indexed repeats share slots; anonymous repeats allocate per occurrence. Unspecified
markers remain unchanged; unused supplied names fail. Values never enter SQL text.
ARRAY/subscript/JSON positives and output-marker collision negatives remain intact.

Scanner conventions remain limited: ASCII dollar tags are canonical, detected
non-ASCII tags fail closed, and every `--` starts a line comment (use `x - (-1)`).
These limitations do not apply to passthrough binding. They still apply to the
separate `orderBy` terminator scan. Other ambiguous regions and driver mapping need
application verification; see [security](security.md) and [design](design.md).

`sourceText` remains cooked, pre-lowering SQL. Selected finite ORDER BY terms become
part of the returned source while the base remains unchanged. There is no general
composition, value-inlined debug output, execution or external-tool integration.

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
| Default 2: meaningful parameter names in review | Use meaningful native names, or `:name` only for positional lowering |
| Default 3: inspectable current schema | Application-owned; not supplied by this library |
| Default 4: real database/driver verification path | Application-owned; Serene's unit suite does not fulfill it for an application |

Contract 3 explicitly permits reviewed application-controlled structural variation.
The ordered whitelist preserves that boundary; it is not treated as a rules violation.
This is a design compatibility assessment, not a certification that every application
using Serene satisfies all default requirements. In particular schema artifacts,
one-statement source ownership and actual DB tests still have to exist in the app.

## Validation and evidence boundary

The current checks cover passthrough and both positional output styles, repeated names, hostile values,
source preservation, binding validation, identity forgery, ordered/empty/invalid sort
selections, scope-aware audit regressions and negative TypeScript cases. The former blanket-rejection tests are superseded by positive replacement tests and
output-style-specific collision negatives. Interpolation, provenance and finite-sort
negative tests remain intact.

Historical 40-case evidence remains pinned to
`b93e3d4a92df353cfdbec6154c0144739f6eb2e6`; its raw files and reproduction guard are
unchanged. Use the detached worktree instructions in the evaluation report. Do not
claim those frozen counts measure this redesigned API or improved AI defect recall.
No live DBeaver, MCP, Docker/database, mapper or AI significance experiment is claimed.

Historical verification at `7c7b6e3` (before the requested-name change):

- `npm run check`: 76 tests passed; strict type checks and tooling syntax checks passed.
- Strict source audit of `test/examples.ts`: three native-driver candidates ordinary.
- `npm pack` and an offline, scripts-disabled install: main runtime works without
  TypeScript installed, with all four output contracts and ordered sorting.
- With the optional TypeScript peer supplied: packed audit import, strict CLI smoke
  and packed consumer declarations (including negative type cases) passed.

Current requested-name change validation is recorded in
[parameter scanning verification](parameter-scanning-verification.md).
