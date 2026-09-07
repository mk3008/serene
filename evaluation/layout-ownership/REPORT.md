# SQL layout ownership decision

**Outcome A: Serene remains layout-neutral and deliberately file-local.** Add only
Serene-owned [coverage/review guidance](../../docs/sql-layout.md). No analyzer change,
layout recommendation, Rules dependency, external PR or new AI study is justified
by this bounded comparison. This completes the ownership decision in Issue #8;
it does not establish that cross-file recognition could never be worthwhile.

## Frozen inputs and method

- Serene main: `b0f9b40f68cf245f1629585447f26edb6125cbac`.
- External reference: [Raw SQL Rules v0.2](https://github.com/mk3008/raw-sql-rules/blob/7d211f53dc67b40c49042fbb671304880bad0319/raw-sql-rules.md),
  blob `6b2a6f659e2d106a12f4f0c9da2c7444f178adf4`. Its dedicated-source practice is
  a customizable project default, not a Serene requirement. No Rules text is vendored.
- [Plan](PLAN.md) and [input hashes](freeze.json) were committed and published in
  the early Draft before measurement. The fixtures, runtime and audit files match
  that frozen main; the verifier checks both worktree hashes and Git source bytes.

Reuse the unchanged `lookup` and `shared` specimens in
`evaluation/adoption/preflight/fixtures`. Each pair differs only in whether its
one `sql` literal is imported from a dedicated module or declared above the operation
in its module. The second specimen has two callers in the **same** operation file;
it is not evidence about multiple caller files or cross-feature reuse.

The identical review objective is to locate the authoritative SQL and follow named
values through `bind` to `prepare(q.text).get(q.params)`. Starting from the known
operation file, the verifier reads it and follows the explicit one-hop SQL import
if present. AST checks record definition, binding, preparation and execution
coordinates, verify `q` originates at the binding, and compare exact function-body
hashes across layouts. One SQL literal per specimen, identical SQL text and identical
function bodies rule out relocating a definition while silently fixing a function.

The route's cached source loader records each actual full-file read once; repeated
AST checks reuse that source. This is a deterministic full-file access route, not a measurement of human/AI
discovery, minimum reads, time or tokens. The same file is read once for both shared
callers. Schema, seed data, dependencies, evaluator setup and the separate audit
directory scan are excluded from this route. They were still available for DB
verification and are not being claimed as zero-cost review artifacts.

## Observations

| Specimen / layout | Definitions / execution sites | Route reads / import edges | Candidate ordinary / review-required | Normal / strict exit |
| --- | --- | --- | --- | --- |
| Lookup / dedicated | 1 / 1 | 2 / 1 | 0 / 1 | 0 / 1 |
| Lookup / colocated | 1 / 1 | 1 / 0 | 1 / 0 | 0 / 0 |
| Shared / dedicated | 1 / 2 | 2 / 1 | 0 / 2 | 0 / 1 |
| Shared / colocated | 1 / 2 | 1 / 0 | 2 / 0 | 0 / 0 |

All eight CLI invocations use the frozen current implementation and identical
`--sink=prepare` configuration, scanning each complete specimen source directory.
Normal and strict JSON stdout, stderr, commands and exit codes are preserved in
[results.json](results.json). No violation was reported. Imported executions remain
unresolved even though their definition modules are included. Candidate counts are
checked against the independently enumerated operation functions and coordinates;
they do not establish general sink coverage. Strict status is diagnostic, not a
score for layout quality or success.

On Node 24.19.0 / native `node:sqlite` / SQLite 3.53.3, **20 actual DB cases** passed:
four lookup cases and six shared-operation cases, in each layout. Returned values,
SQL strings, named arguments and execution traces match across each pair. Independent
expected answers cover tenant-specific values, missing records, hostile bound strings,
insufficient balance and an invalid amount that returns without executing SQL.
Account state remains unchanged. These are real isolated in-memory DB executions,
not a mock; the observation wrapper forwards unchanged SQL and values to the driver.
This only validates the selected reads and argument mapping, not production security,
other engines, transactions or concurrent behavior.

Three in-memory static negative controls (wrong module, wrong export and renamed
local import) all remain review-required at execution. The renamed import can be
valid code; it is an uncertainty control, not a vulnerability. These checks preserve
the current file-local limit. They do **not** prove a hypothetical cross-file resolver
safe: none was implemented or claimed. No fixture/source mutation was persisted.

## Why Serene owns only the boundary explanation

The measured friction is real: imports require one extra source hop on this route
and leave three execution candidates unresolved across the two specimens. Bounded
cross-file recognition could potentially remove those static referrals. We do not
relabel them as ordinary or dismiss that possible benefit.

However, neither layout obscures the source, values or execution in these examples.
The dedicated definition remains explicit, and the operation retains binding and
driver context. The two colocated callers also share one definition without copying
SQL. The comparison supplies no evidence of repeated deep investigation or incorrect
review caused by the extra hop. It cannot measure cognitive effort or decide how
often that friction matters in real projects.

The product judgment is to retain the small existing boundary rather than commit
to new module/source identity and invalidation responsibilities on that evidence.
For example, a safe direct-import mechanism would need to specify which exact source
and export a host resolved, distinguish runtime availability from static identity,
and keep missing, changed, re-exported or mutable paths unresolved unless separately
supported. This is an inferred maintenance obligation, not a measured impossibility
or proof that bounded support needs a whole-program engine.

Similarly, one fewer deterministic read in these two specimens does not justify
prescribing colocation for users whose dedicated SQL serves other review/reuse needs.
No claim is made that the layouts are universally equal or that dedicated sources
are preferable. Serene owns its provenance labels and how to handle them; application
owners choose layout. This is outcome A with documentation of an existing boundary,
not outcome B's new preferred layout or outcome D's undecided checkpoint.

Revisit implementation if real imported paths show repeated construction-review
work that a narrow explicit mechanism can avoid, together with a testable coherence
contract and negative controls. A future layout preference would need evidence of
review value in its intended use beyond strict exit differences. No broad cohort is
required or proposed now; no AI behavior question is essential to this bounded choice.

## Reproduction and limits

From the repository root: `npm run build`, then
`node evaluation/layout-ownership/verify.mjs`. The verifier writes the compact result
artifact and asserts provenance traces, native behavior, pairing and audit outcomes.
`node --check evaluation/layout-ownership/verify.mjs` and `git diff --check` also
pass. Production code and exports are unchanged; no new package/runtime gate is claimed.
It uses only existing dependencies and frozen fixtures. The implementation and
acceptance code were written by the same author; these are reused diagnostic
specimens, not a held-out/blinded study. There were no failed measurement runs,
subagents or AI participant runs. No cost or generalized effectiveness claim follows.

The older unexecuted [layout study](../adoption/LAYOUT-STUDY.md) is historical and
superseded for Issue #8. Its upstream policy proposal and large study are not
remaining execution gates. Raw SQL Rules can independently inspect this public
Serene result; no change or PR is requested from that project.
