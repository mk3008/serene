# Small exploratory review results

Twelve fresh reviews were requested with **gpt-5.6-luna / medium**, one per task/arm.
All four arms identified the three frozen defects in their answer text. This small,
conspicuous task set reached a semantic recall ceiling and does not show an
incremental audit-versus-grep discovery benefit. Additional claims exposed contract
ambiguities; one grep-arm answer was malformed JSON. Neither issue is erased by
rerunning participants or revising the frozen gold.

| Outcome across three tasks | A: raw | B: Serene | C: + grep | D: + audit |
| --- | ---: | ---: | ---: | ---: |
| Frozen defects identified in text | 3/3 | 3/3 | 3/3 | 3/3 |
| Outside-construction defects identified | 2/2 | 2/2 | 2/2 | 2/2 |
| Valid structured answers | 3/3 | 3/3 | 2/3 | 3/3 |
| Claimed inspected execution sites | 12/12 | 12/12 | 12/12 | 12/12 |
| Additional findings beyond frozen gold | 3 | 1 | 1 | 4 |

These are task-clustered descriptive counts, not twelve independent defect trials
per arm. Birch has two gold defects, Cedar one, and Maple zero; safe-task recall is
N/A. The malformed C/Birch answer (v09) contains both mechanisms, but remains a
structured-output failure. Semantic reading is reported separately from successful
machine-readable delivery; it is not a repaired replacement answer.

## What the experiment can and cannot answer

The tenant predicate omission and wrong business state were found in every arm,
including when audit classified Cedar's construction as ordinary. There was no
observed outside-construction miss on these tasks. Grep and audit both exposed all
known execution sites; the reviewer lists cover all sites, but these lists are
self-reported and do not measure attention or review effort.

No task-level known-defect recall difference appears in D/C, D/B or B/A. One C
format failure is an observed failure, not evidence that audit generally improves
format reliability. Tokens and exact served model snapshot are unavailable. Timing
includes orchestration, and an effort/cost advantage cannot be estimated. The source
is short (roughly 40–50 lines after removing padding) and the bugs are conspicuous.
Do not claim general review effectiveness from the ceiling.

Additional findings concern whether invalid status values must be rejected, whether
missing update targets must cause an error, whether authenticated contexts always
include userId, and whether numeric zero is a valid identifier. The frozen contracts
leave these points insufficiently specified. In addition, v09 says status=deleted
can return deleted invoices even though status != :deleted remains in the same
WHERE conjunction; that subclaim is contradicted by the source. Report disputed
claims separately rather than silently counting every non-gold claim as false or
adding new gold after the answers. This limits any false-alarm comparison.

## Evidence and validation

The complete packet/source/gold/prompt freeze is remote commit
`80c959fcff174aef1a3904a1d47510e4f722ef1c`, tree
`83939864b4e73d3eefb7951562b19b45eaa07c3c`, before any scored dispatch.
See [protocol](PROTOCOL.md), [freeze](freeze.json), [hashes](source-hashes.json),
[exact supplied packets](packets/), [unedited answers](results/),
[delivery record](delivery.json), [timing](timing.json),
[independent adjudication](adjudication.json), and
[root reconciliation](RECONCILIATION.md). The reconciliation preserves the original
adjudicator's arithmetic errors and status-validation disagreement; report totals
are recomputed from its per-case records in [aggregate.json](aggregate.json).

Luna/medium authored the new paired tasks. Root found and corrected preparation
failures before freeze; [authoring history](AUTHORING.md) retains them. Fourteen
capturing-wrapper cases verified matching raw/Serene SQL and named values across
all exported functions and exercised branches, with timestamps normalized.
[Terra/medium independent validation](independent-validation.json) passed the
corrected set. This is mock pairing, not native SQLite execution for these review
tasks. The earlier adoption study's live SQLite evidence is separate.

All twelve sessions used fork_turns:none and the same requested model/effort. No
model switch, timeout, retry, source edit or protected-packet mutation occurred.
One saved answer failed JSON parsing. All frozen source/gold/prompt hashes remained
unchanged. A separate fresh Luna/medium adjudicator assessed shuffled source,
contracts, frozen gold and unedited answer text without treatment labels. Source
style can reveal representation; this is not complete blinding or physical packet
isolation. Shared filesystem access remained technically possible, and tool/access
reports are self-reported rather than a full exported event trace.

## Decision and next boundary

The low-cost cohort is sufficient to reveal a recall ceiling, a format failure and
weaknesses in the task contracts. Do not spend on an automatic larger replication
of these tasks or promote the result to an audit value claim. Keep the runtime and
Raw SQL Rules unchanged, and keep PR #4 Draft.

Before a larger review study, specify identifier types/valid ranges, authenticated
context shape, invalid-filter behavior and no-match semantics; require executable
oracle checks for those domains; use less conspicuous, larger application tasks
with meaningful discovery effort. Any revised task or Terra/medium comparison
requires a new freeze and separate results. The planned 48-run review study and
controlled dedicated-file/colocated layout comparison remain unperformed. The
current evidence cannot decide Raw SQL Rules Default 1 or the smallest adoption
instruction.
