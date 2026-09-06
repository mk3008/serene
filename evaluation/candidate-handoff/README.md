# Candidate handoff PoC

This evaluation-only adapter tests preservation and conservative coordinate matching.
It does not discover SQL, change the package API, or establish end-to-end savings.
Requested scope: https://github.com/mk3008/serene/pull/4#issuecomment-5561998905

Run after `npm run build`:

```sh
node evaluation/candidate-handoff/handoff.mjs /absolute/repository FULL_COMMIT_SHA < candidates.jsonl > classified.jsonl
node --test evaluation/candidate-handoff/test.mjs
```

Each input line is a tool-independent candidate object:

```json
{"id":"optional","revision":"full 40-character commit SHA","file":"src/app.ts","line":12,"column":3,"kind":"execution"}
```

Coordinates are 1-based call-expression start coordinates, matching the existing
TypeScript audit output (columns use TypeScript's UTF-16 character offsets). The
optional function name is descriptive; it does not repair or resolve coordinates.
This PoC requires column even for single-call lines: line-only input cannot select
one call safely in general. Range-based input is not implemented. Duplicate IDs and
duplicate coordinates are preserved, with an output ordinal for input correlation.
No persistent ID service is needed for this bounded, revision-scoped transaction.

For each record the adapter reads only its referenced source, verifies the requested
revision equals repository HEAD and the working source equals the committed source,
then runs the existing complete audit and selects only an exact driver-candidate
coordinate match. A source parse error prevents skip. No match in actionable output
is never treated as ordinary; actionable-only output is not consumed at all.
Only an explicit ordinary finding produces `skip: true`. Review-required and
violation classifications are preserved; all other cases are unmatched and
`skip: false`. Candidate objects are returned unchanged. Invalid JSON and blank
lines produce unmatched records containing their raw line, rather than disappearing.
Invalid invocation configuration (e.g. nonexistent revision) fails the process
before processing; it must not be interpreted by a consumer as a successful empty
classification. No search endpoint or raw-grep parser is included.

## Fixed validation result

[Test source](test.mjs) fixes inputs and expected decisions. [Recorded output](results.json)
contains 24 input/output records: 21 object cases, null, malformed JSON and a blank
line. Three records skip (ordinary, an exact ordinary call adjacent to another call,
and a duplicate-ID ordinary record); 21 do not. Candidate loss is zero, and object
payload identity and ordinal are checked. Two additional invocations confirm dirty
source and advanced HEAD with unchanged source both prevent skip.

| Boundary | Expected / observed |
| --- | --- |
| Exact ordinary | ordinary, skip |
| Exact review-required / violation | original level, no skip |
| Shifted line or column | unmatched |
| Missing column; function name only | unmatched |
| Stale input revision | unmatched |
| Caller or wrapper kind; wrapper location | unmatched |
| Missing file; unsupported source or sink | unmatched |
| Two calls on one line without column | unmatched |
| Two calls on one line with exact columns | ordinary and review-required respectively |
| Parse error; parent traversal; unknown kind | unmatched |
| Duplicate ID | separate output, original candidate retained |
| Null, invalid JSON, blank line | unmatched record retained |
| Dirty source; changed repository revision | unmatched |

The test exercises the real CLI via stdin/stdout, Git snapshots and real audit;
classifications are not mocked. It is a deterministic boundary test, not an agent
study or model comparison. The temporary Git fixture is removed after execution;
its full source and construction commands remain in the test. The recorded commit
SHA identifies that test invocation, not a published application commit.

## Boundary of the result

Revision + exact source coordinate identifies a call within the supplied snapshot.
It cannot detect that a producer intended a different call but supplied a valid
coordinate for this one. Discovery still owns candidate identity and whether the
call really is a database execution. The existing audit recognizes sink names, not
whole-program driver identity; this PoC does not upgrade that guarantee. Explicit
wrapper/caller candidates are retained for review, and no wrapper classification is
propagated to its callers. Incorrectly labeling a wrapper as an execution remains
an upstream identity risk, not something a JSON field proves away.

Input is an immutable-snapshot handoff convention, not a concurrent-filesystem
transaction: callers must prevent repository edits during consumption. The adapter
checks each candidate and does not cache stale source, but does not lock the repo.
Symlink paths are rejected. Resource limits, alternative hash formats, generalized
ranges, concurrency and production schema/versioning are not settled by this PoC.

The requested preservation/matching cases pass under these boundaries. An eventual
end-to-end comparison must separately measure Discovery recall, match/unmatched,
actual ordinary omission, dangerous-site recall and output bytes. No such comparison
was run here, and earlier covered-site ~35% results are not pooled. PR remains Draft.
