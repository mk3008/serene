# Initial implementation report

Date: 2026-09-06. Package: `@mk3008/serene@0.1.0`.

Implementation and local verification: **done within the documented initial scope**.
The user created the GitHub repository at https://github.com/mk3008/serene during
implementation. Source history is delivered to that repository. No npm publish was
performed. Ashiba was not changed.

## 1. Selected design

Literal-only SQL tags, opaque runtime identities, a small dialect-aware parameter
scanner/binder, one finite ORDER BY operation, and an optional file-local source
audit. Applications call native drivers themselves. The runtime entry has no
external imports or runtime dependencies.

## 2. Why this is minimal

No SQL AST, generated bindings, driver lifecycle, row mapping, result contracts,
lint framework or generic fragment composition. TypeScript supplies the source
parser and lexical binding for tooling; Node supplies tests. Source audit is needed
because runtime template-array checks cannot prove literal origin.

## 3. Triage

Recognized literal/bind paths are ordinary; unknown/raw candidate paths require
review; visible interpolation, concatenation, fabricated tag calls and lexical
policy errors are violations. Runtime checks reject invalid bindings and sort keys.
Source diagnostics include locations and explanation codes. Ordinary is a narrow
construction classification, not a security verdict. Undiscovered sinks are not
claimed as covered. Runtime provenance must be combined with source review.

## 4. Public API

`postgres`, `mysql`, `mssql`, `sort`, `orderBy`, `bind`, `review`, `SereneError`;
optional `auditSource` and `serene-audit`. Binding renders `$n`, `?`, or `@name` with
the corresponding repetition semantics. SQL Server also accepts native `@name`.

## 5. Verification

Environment: Node 24.19.0, npm 11.9.0, TypeScript 5.9.3.

| Check | Result |
| --- | --- |
| JavaScript tooling syntax checks | Passed |
| Strict runtime and usage TypeScript checks | Passed, including negative type cases |
| Node test suite | 62 passed; 0 failed; 0 skipped |
| Strict source audit of three native-driver usage examples | Passed; all three driver candidates ordinary |
| `npm pack` | Passed; runtime JS, declarations and optional tooling included |
| Offline packed-package install without dev/optional dependencies | Passed; only Serene installed |
| Runtime imports and three binding conventions without TypeScript installed | Passed |
| Consumer type checks against packed main and audit exports | Passed |
| Live PostgreSQL/MySQL/SQL Server execution | Not run |
| Bun / Node 22 execution matrix | Not run |
| Whole-application sink coverage or measured review-effort benefit | Not evaluated |

Tests cover hostile values, repeated parameters, own-property/prototype names,
missing/extra/undefined/accessor values, immutable text, literal misuse, runtime
template spoofing limits, finite sorting, lexical boundaries, casts/dollar quotes/
nested comments, false provenance from casts/import shadowing, unresolved paths,
source parse errors, and CLI exit policy. No test was weakened to pass.

## 6. Intentionally omitted

ORM, mapper, driver wrapper, connection/transaction handling, WHERE builder, SQL
syntax/schema/performance checks, arbitrary runtime SQL admission, code generation,
cross-file analysis, C# and Bun adapters. The initial sort grammar is deliberately
small; appended ORDER BY does not solve arbitrary clause placement or pagination.

## 7. Ashiba reuse

Adapted the lexical-skipping/lowering approach, strict parameter-name set validation,
repeated-name conventions and representative regression scenarios. Added dialect
boundaries and provenance/source checks. Kept MIT attribution; no Ashiba dependency
or API compatibility. See design.md for exact snapshot references. Historical Ashiba
database experiments are not claimed as Serene database validation.

## 8. Additional review requirements

Included low-cost binding-mistake checks, unknown-sort rejection, structured error
codes/locations and a strict CLI option. Future candidates: actual-application sink
inventory, selected live-driver regression probes and review-effort measurements.
Broader dataflow analysis or language adapters remain proposals, not implemented work.

## 9. Non-guarantees

No complete SQL safety, correctness, schema/type matching, authorization, performance,
second-order injection protection, driver serialization verification or exhaustive
source coverage. An arbitrary process can fabricate template arrays; source audit
flags direct tag calls but does not sandbox malicious code. Text/value pairing at the
native driver remains application responsibility. See security.md before adoption.
