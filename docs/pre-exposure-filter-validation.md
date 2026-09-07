# Production filter validation

Issue #7 ships one library boundary rather than a host matrix or new AI study.
The implementation reuses PR #4's conservative construction-only recognition
approach. Production code does not import evaluation code; the main SQL runtime
and audit classifications are unchanged.

Run `npm run check`. Focused checks are `test/filter.test.mjs` and
`test/filter-gate.test.mjs`; declaration checks are in `test/types.ts`. They cover
stale full source (including changes outside requested ranges), revision/file
mismatch, altered range text, invalid offsets, unsupported files, parse failure,
partial/overlapping/duplicate/empty ranges, CRLF/Unicode, same-line neighbors,
mixed construction and effectful expressions.

The gate reuses committed ticketing source from PR #4 at base
`59f379bcc9371b6e24d45c6e83d1710da27d702f`. This is deterministic interface validation,
not a held-out effectiveness study.

| Required behavior | Result |
| --- | --- |
| Ordinary bodies delivered as source | 0 of 7 |
| Primitive search hits represented | 10 of 10 |
| Nonordinary hits retained as exact source | 3 of 3 |
| Function names and execution coordinates | All 7 match explicit expected metadata |
| Remaining source and neighboring trivia | Exact partition outside ordinary spans |
| Stale revision/source | Original supplied ranges retained |
| Repeated calls | Deep-equal results |

The initial marker duplicated function names on execution sites and carried both
function line/column spans and offsets. A small full-read measurement showed its
overhead exceeded the original response. Removing redundant fields kept function
offsets and execution coordinates. No cache, cross-request deduplication or generic
configuration was added.

The gate prints JSON byte counts using opaque revision `r1` and short fixture file
names. Baseline is `{ ranges }`; filtered size includes the complete returned
result. Host input contexts are excluded in both cases.

| File | Original bytes | Initial payload bytes | Final payload bytes |
| --- | ---: | ---: | ---: |
| operations.ts | 1,421 | 1,463 | 1,115 |
| reporting.ts | 993 | 1,093 | 910 |
| maintenance.ts | 836 | 893 | 810 |

These fixed-response shape measurements are not model tokens, latency, money or
a general compression ratio. Revision/path lengths and range selection change
overhead. Body omission and source preservation are the primary product gate.

The original acceptance gate needed no fresh AI participants: its criteria are
deterministic interface properties. A requested follow-up used exactly two fresh
Luna / medium participants for a bounded behavior smoke check; see the
[protocol, traces and result](../evaluation/filter-smoke/REPORT.md). It found no
clear workflow disruption requiring a product change, without establishing an
effectiveness or cost benefit. No npm publication or product host adapter is included.
PR #4 behavioral results and Issue #6 adoption results remain separate evidence.

## Package gate

Validation on Node 24.19.0 and TypeScript 5.9.3 passed `npm run check` (104 tests,
syntax checks and declarations). `npm pack` was installed into a temporary external
consumer with `--offline --ignore-scripts --legacy-peer-deps`. The main SQL entry
loaded before supplying TypeScript. After making the existing TypeScript peer
available, the packed `/filter` entry suppressed a fixed function, retained dynamic
SQL and rejected a stale revision without suppression. An external NodeNext
TypeScript consumer checked public types and rejected a missing current source.
This verifies the packed boundary, not registry publication or an AI-host adapter.
