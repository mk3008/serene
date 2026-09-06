# Connect Serene before source delivery

The selected method is a response-boundary filter on both search and read tools.
It leaves search/discovery scope with the caller and uses Serene before returning
source to the AI. A positive ordinary construction-only function becomes a compact
marker; actionable, mixed and unresolved functions remain visible. There is no
later candidate-handoff response whose cost must be paid after reading the bodies.

## Connection and use

For a SQL-construction-only review session:

1. Pin a source revision. The controller checks HEAD and the exact committed source
   against the requested rows. A stale or unmatched source cannot acquire a mask.
2. Let the agent choose a search pattern or file/range. Run that primitive normally
   on the pinned repository inside the host process, before sending its output.
3. Pass numbered source rows through `filterRows(source, file, revision, rows,
   snapshotValid)` from [filter.mjs](filter.mjs). Send only the returned `rows` to
   the agent. Keep `correspondence` and mask evidence internal for validation.
4. Apply the same filter to subsequent source reads. Filtering only the initial
   search leaves an easy accidental body-exposure route through a later read.
5. Let the agent collect exact execution candidates and review remaining source.
   Ordinary markers are construction provenance, not a complete execution inventory.

[controller.py](controller.py) is the runnable demonstration; [prepare.py](prepare.py)
stages the paired source-only repositories and [prompts](prompts) documents its
operations. In a fresh checkout run the repository build, then `python
evaluation/pre-exposure/prepare.py`; each prompt uses the staged run-specific
controller. Existing run roots are intentionally not overwritten. The runtime
package and production audit CLI gain no new API in this experiment.

A production host must insert this boundary into every source-bearing tool used by
this review. An ordinary shell command returning raw `rg` output directly to the
agent does not implement it. This environment demonstrates instruction-mediated
controller use, not an OS-enforced sandbox or a shipped integration for arbitrary
editor/search platforms. The filter does not own Discovery and has no gold/site list.

## Selection and behavior gate

Only one materially distinct approach was needed. [attempts.json](attempts.json)
records hypothesis, revisions and keep decision. Independent preflight found two
ways that whole-function masking could hide separate construction in arguments;
these shapes are now retained and have negative regression tests. Earlier findings
and their resolution remain in [preflight-review.json](preflight-review.json).
No failed production API, adapter or CLI was added.

The actual controller's deterministic 10-site gate preserved all 10 primitive
search-match rows: 7 ordinary locations plus 3 source matches. All-file response
bytes decreased from 9,387 to 5,294; simple execution-line search from 1,045 to 907.
Ordinary bodies were never delivered; all three nonordinary bodies remained.
These row-preservation counts do not measure Discovery coverage.

One fresh Luna/medium probe then discovered all 10 exact coordinates, skipped all
7 ordinary bodies with zero exposure at every stage, and investigated all three
remaining paths, including unsupported `sendSql`. Its one injection diagnosis was
correct, false findings zero. Total response bytes were 7,490, including two invalid
path-search errors. The agent invented six optional function-name annotations for
hidden ordinary functions; these remain uncorrected in the log. Coordinates were
the predefined discovery endpoint, but the annotations are not reliable. Do not
interpret hidden function names or business semantics from an opaque marker.

[Independent probe adjudication](probe-adjudication.json) passed before the pushed
freeze [04dd073](https://github.com/mk3008/serene/commit/04dd0737352a99571e7ab16e84179ac432a05c12).
The [protocol](PROTOCOL.md), source/gold hashes, controller, prompts and scorer were
frozen before the four scored runs. The probe is excluded from their comparison.

## Descriptive benchmark

All four fresh reviews completed without retries or mid-run changes. Operation
response bytes fell **43.3% / 31.9%** on ticketing / stockroom. Including the text of
the initially loaded prompt reduces these savings to **31.8% / 21.8%**. These are
observed delivered-content measures, not a claim of equal token or monetary savings.

| Task | Raw operation response bytes | Serene operation response bytes | Change | Raw with prompt text | Serene with prompt text | Change |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Ticketing | 11,392 | 6,456 | −43.3% | 13,881 | 9,464 | −31.8% |
| Stockroom | 10,526 | 7,173 | −31.9% | 13,015 | 10,181 | −21.8% |

The protocol's primary measure is the complete controller response stream. The
supplemental prompt-inclusive column also adds the once-read prompt file text:
2,489 bytes Raw, 3,008 Serene. Native tool-envelope bytes and hidden model context
remain unmeasured; the table must not be described as total model cost.

| Task/arm | Source text bytes | Read / search / all controller calls | Request JSON bytes | Operation response bytes through correct diagnosis |
| --- | ---: | ---: | ---: | ---: |
| Ticketing Raw | 4,392 | 5 / 2 / 11 | 3,877 | 11,349 |
| Ticketing Serene | 1,743 | 3 / 3 / 10 | 3,197 | 6,413 |
| Stockroom Raw | 3,900 | 4 / 2 / 11 | 4,857 | 10,483 |
| Stockroom Serene | 2,112 | 5 / 2 / 11 | 3,184 | 7,130 |

Source-text delivery fell 60.3% / 45.8%. Calls did not uniformly decrease: stockroom
Serene used one more read. Both Raw reviewers read all seven ordinary bodies during
Discovery, then reused that evidence. Both Serene reviewers received zero ordinary
body lines in **any phase** and skipped all seven after positive markers. Ticketing
Serene used targeted reads for the remaining paths; stockroom used broader reads
whose ordinary portions were filtered. Stage accounting remains in [scores.json](scores.json).

| Outcome | Ticketing Raw | Ticketing Serene | Stockroom Raw | Stockroom Serene |
| --- | ---: | ---: | ---: | ---: |
| Exact Discovery recall / precision | 10/10 / 10/10 | 10/10 / 10/10 | 10/10 / 10/10 | 10/10 / 10/10 |
| Ordinary bodies exposed, any stage | 7 | 0 | 7 | 0 |
| Positive marker + disposition + no body exposure | 0 | 7 | 0 | 7 |
| Nonordinary paths fully read and dispositioned | 3 | 3 | 3 | 3 |
| Unsupported `sendSql` path retained and investigated | 1 | 1 | 1 | 1 |
| Correct danger diagnosis / false findings | 1 / 0 | 1 / 0 | 1 / 0 | 1 / 0 |
| Controller errors included in cost | 0 | 0 | 2 | 0 |

Both Serene runs preserved every input source row through a valid internal output
correspondence: match-row loss zero. Independently scored final execution discovery
also missed zero sites. Those are two separate checks, not an ordinary-derived
coverage claim. Every discovered candidate received a disposition. The Serene stockroom agent
invented seven incorrect optional function-name annotations for hidden sites,
although their exact coordinates were correct. These are preserved and excluded
only from the predeclared coordinate metric, not silently corrected. The table's
zero false findings refers to vulnerability reports, not these metadata mistakes.
Opaque markers support location-based triage; they do not justify inferred names.

Stockroom Raw made an invalid-path search and a discover request with an unknown
field; it corrected its requests within the same run. Both error responses remain
in costs. It also used the label `skip-ordinary` for nine self-screened safe sites.
This is **not** Serene omission: their bodies were read, there were no positive
markers, and actual marker-based skip is scored zero. No coordinate or answer was
repaired by the evaluator.

Internal filter I/O was ticketing 18,476 input / 10,987 output bytes and stockroom
19,970 / 12,274. None of that internal source or ledger entered the reviewer response.
The sum of controller execution times was approximately 2.99 / 2.68 seconds for
Serene versus 0.016 / 0.009 seconds for Raw. This process-per-file prototype therefore
adds local computation despite reducing AI-visible content; these noisy command
elapsed sums are not isolated filter CPU measurements or model-latency claims.

For the **same Serene requests**, reserializing the unfiltered primitive rows would
produce 8,305 / 11,589 operation-response bytes, compared with actual 6,456 / 7,173.
Thus the transformation itself removed 1,849 / 4,416 bytes on those exact requests.
This deterministic replay is not another AI baseline: total paired differences
also contain agent search/read choices and Raw/Serene representation differences.
Do not attribute every byte of the paired difference to the classifier alone.
See [reproducible cost details](cost-details.json). Terra/medium independently
checked logs against gold and source, including finding mechanisms, exposure,
correspondence and byte counts; see [benchmark adjudication](benchmark-adjudication.json).
The frozen-input and staged-repository integrity check also passed after all runs.

The method is viable in this mediated boundary: interception happens early enough
that ordinary body compression remains available. It does not show that adding a
standalone audit command to an arbitrary existing agent workflow has this effect.
The result selects this connection pattern for construction review, with the
coverage and host-integration limits below.

## Evidence and limits

- [Frozen inputs](freeze.json), [controller gate](controller-gate.json),
  [probe results](probe-scores.json), [raw operation logs](results).
- Task sources and independent gold are reused unchanged from the preceding
  end-to-end cohort: ticketing and stockroom, one fresh Luna/medium run per arm per
  task. This is a small method comparison, not a new held-out efficacy benchmark.
- Actual controller JSON response bytes include metadata, errors and acknowledgments;
  raw search/audit subprocess output is internal, separately retained and measured.
  Prompt/request/source bytes and calls are separate quantities. Native tool wrapper
  overhead, model tokens, money, hidden reasoning and complete native session
  transcripts are not measured. Recorded operations are inspectable, not proof of
  an OS-enforced ban on other tools.
- Ordinary attests SQL construction only. The audit's sink-name heuristic does not
  prove native-driver identity, SQL meaning, binding correctness or whole-program
  coverage. General review must use the unfiltered source. Defaults, mixed bodies,
  wrappers not locally recognized, computed calls, unsupported sinks and uncertain
  provenance retain source and therefore reduce compression when prevalent.
- The small recognizer masks entire verified construction-only top-level functions.
  It is conservative about other syntax rather than extending Serene's runtime
  contract. Same-line neighboring actionable source retains its exact columns.
- This result must remain separate from the prior later-handoff +34.0% / +49.9%
  output increase and the older conditional covered-site reduction. Different
  connection points are different workflows; no pooled product score.

PR #4 remains Draft. No runtime/exports changes, npm publish or merge.
