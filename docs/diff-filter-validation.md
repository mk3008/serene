# Issue #5 deterministic validation

Decision: ship `filterConstructionDiff` in the existing optional `/filter` entry.
It reuses the production construction recognizer and adds complete-edit coherence
and paired-function checks. Independent source filtering of each diff side was
rejected at design time: it cannot reconcile ordinary-to-nonordinary transitions.
There is no second implementation, new parser, Git client or host matrix.

| Acceptance gate | Deterministic evidence |
| --- | --- |
| Every change represented | One indexed output per input record; multiple edits, mixed hunks and two actual Git zero-context hunks tested |
| Ordinary compression | Changed source omitted on both sides with explicit modification/addition/deletion, file/revision, offsets, function and execution metadata |
| Actionable preservation | Raw concatenation retained byte-for-byte as source text beside ordinary changes; mixed/coarse hunks remain whole |
| Transition safety | Both directions of ordinary versus dynamic, raw, unmatched and mixed construction tested; interpolation also disables unrelated compression |
| Addition/deletion safety | Empty sides stay explicit; whole-function/file creation and deletion retain original text |
| Freshness/coherence | Both sides' file/source/revision mismatches, same revision with different source, altered text, bad offsets, missing/overlapping/out-of-order edits fail closed |
| Determinism | Repeated output deep-equal; inputs unchanged |
| Follow-up compatibility | Existing source filter works for ordinary head reads and retains source after an import invalidates ordinary provenance |
| Unchanged affected execution | Import-only edit reports lost ordinary navigation even though the execution line is outside the changed region |

`test/diff-filter.test.mjs` contains 22 tests, including duplicate names, function
renames/moves, parse failure, unsupported/renamed files, Unicode/CRLF, partial-line
edits, no terminal newline and malformed envelopes. The Git test decodes only its
fixed LF, zero-context fixture inside the test host; it is not a production patch
decoder or a claim of universal unified-diff support.

Validation on Node 24.19.0 / TypeScript 5.9.3:

- `npm run check`: 126 tests passed, plus syntax and type checks.
- `npm pack` installed into a temporary external consumer, offline with scripts
  disabled and legacy peer handling. Main runtime loaded without TypeScript.
  With the existing TypeScript peer supplied, the packed `/filter` export compressed
  an ordinary modification, retained a stale response and supported a head read.
- External NodeNext declarations checked; a missing full head context was rejected.
- `git diff --check` passed.

The first direct test invocation failed because the new worktree had not built
`dist/index.js`, which the existing audit imports. Running the normal build resolved
that setup failure; no assertion or safety condition was relaxed. No participant
failures or model costs exist: no subagents or AI runs were needed or used.

The deterministic gate answers the bounded product question. This completes Issue
#5's production-capable checkpoint, not host installation or a general review study.
The original Issue #7 filter and its behavioral evidence are not re-measured.

Limitations are explicit in the [API guide](diff-filter.md): the host must decode
and preserve its patch semantics and provide coherent complete sources; ordinary
set changes disable compression for the entire file pair; coarse hunks, whole
function changes and unsupported changes may remain uncompressed. Context mismatch
preserves supplied records but cannot manufacture omitted patch records. Review
coverage requires the host to resolve that failure rather than display no changes.
No SQL-meaning, authorization, binding, cross-file or token-saving claim is made.
