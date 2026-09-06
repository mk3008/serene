# End-to-end construction review: added handoff cost was not recovered

On two new small applications, this workflow did **not** reduce total tool-response
bytes. Serene increased completed-workflow output by 34.0% (ticketing) and 49.9%
(stockroom), with the same correct dangerous-site diagnoses and no false findings.

Both Serene agents skipped seven matched ordinary bodies after handoff, but both
Raw and Serene agents had already read all seven during Discovery. Raw required no
additional source reads after submitting its candidates. Therefore post-handoff
ordinary skip did not create incremental source-read savings here; the real JSONL
handoff added roughly 4 KB per run. This is the observed boundary of this small
explicit workflow, not a general rejection of Serene or a new efficacy proof.

## Scope and execution

The [protocol](PROTOCOL.md), [prompts](prompts/), [source/gold](tasks/), controller
and scorer were [frozen](freeze.json) and pushed as
905e9c8f9c21f94ad4b4de099e247b47be7ad89e before the four scored runs.
Two new authored applications, ticketing and stockroom, each have ten execution
sites across three source files plus a public driver contract. Each has seven fixed
construction counterparts, one unsafe HTTP-input concatenation, one safe raw literal
that requires review, and one safe execution using an unsupported sendSql sink.
There is no supplied execution-site index.

One fresh Luna/medium agent per arm per task independently discovers sites and
continues review in the same context. Runs were executed in paired batches of two,
ticketing then stockroom. Both arms use the same source read/regex-search controller,
prompt structure and limits. Serene's additional instruction invokes the real JSONL
handoff and skips positive ordinary matches. All four scored runs finished; none
was retried, coached or modified mid-run.

The paired raw/Serene source variants produce identical driver method, SQL text and
native named parameter objects in [24 stub invocation pairs](fixture-parity.json).
The [runnable verifier](validate-pairs.mjs) uses the actual local Serene runtime.
This is not a live native driver/DB test. Independent [preflight](preflight-validation.json)
checked all 48 authored coordinates, audit categories, staged snapshots and scorer
boundaries. Raw manual fixed-construction categories are explicitly distinct from
Raw's actual audit classification; Raw agents do not invoke audit.

## Calibration and measurement correction

The initial calibration failed the original gate on EOF-range errors, a finding
reported at the correct construction line rather than execution line, and a gate
that demanded rereading dangerous source already inspected in Discovery. Its
[logs](results/cr.jsonl), [paired log](results/cs.jsonl),
[scores](calibration-scores-v1.json) and [failed gate](calibration-gate-v1.json)
remain unchanged and excluded from scored results.

The [amendment](calibration-amendment.md) clamps read ends at EOF, distinguishes
diagnosis localization from exact execution coordinates, and permits reuse of
previous source evidence. It does not loosen candidate matching or permit ordinary
rereads to count as skips. [Independent amendment review](calibration-amendment-review.json)
approved a new fresh calibration pair. That pair passed the [behavioral gate](calibration-gate.json)
and [independent mechanism adjudication](calibration-adjudication.json) before freeze:
Raw self-screened both ordinary bodies, Serene omitted both after real handoff,
retained/investigated actionable and unmatched candidates, and both diagnosed the
dangerous construction. Errors were zero in the second pair.

Calibration already showed full ordinary exposure during Discovery and an added
Serene cost. The scored conditions were not optimized to reverse that result.
Four calibration runs are preparation costs, not part of the four scored samples.

## Full costs and cost to diagnosis

All table values are UTF-8 response bytes from the mediated tools.

| Task | Raw to correct diagnosis | Serene to correct diagnosis | Raw completed workflow | Serene completed workflow | Completed change |
| --- | ---: | ---: | ---: | ---: | ---: |
| Ticketing | 11,699 | 15,688 | 11,742 | 15,731 | +34.0% |
| Stockroom | 11,178 | 16,782 | 11,221 | 16,825 | +49.9% |

Diagnosis cost is cumulative through the recorded correct finding, including all
prior Discovery, handoff, errors and other responses. It measures first submitted
correct diagnosis, not unobservable internal recognition time. Finding submissions
were allowed during Discovery; the protocol did not force them to wait for handoff.
All four agents submitted after their discovery list. Each then finished with a
further 43-byte acknowledgement.

| Run | Discovery | Handoff / triage | Remaining review and finish | Total |
| --- | ---: | ---: | ---: | ---: |
| Ticketing Raw | 11,656 | 0 | 86 | 11,742 |
| Ticketing Serene | 11,666 | 3,979 | 86 | 15,731 |
| Stockroom Raw | 11,135 | 0 | 86 | 11,221 |
| Stockroom Serene | 12,200 | 3,974 | 651 | 16,825 |

The discovery stage includes source inspection, which can also accomplish screening.
These stages mark operations before/after the candidate submission; they do not
prove that human-like mental tasks occurred in separate phases. Ticketing's
difference is almost entirely handoff output. Stockroom also has more Discovery
output and one later unmatched-source read; those are not attributed to audit alone.
Independently discovering the two source variants avoids supplying a preselected set,
but cannot isolate a causal triage effect from agent choices and representation.

| Run | Agent request JSON bytes | Handoff JSONL input bytes | Handoff raw output bytes | Source text bytes delivered | Read / search / total calls |
| --- | ---: | ---: | ---: | ---: | --- |
| Ticketing Raw | 4,917 | n/a | n/a | 4,551 | 5 / 3 / 13 |
| Ticketing Serene | 3,263 | 1,610 | 3,434 | 4,396 | 5 / 3 / 13 |
| Stockroom Raw | 3,775 | n/a | n/a | 4,066 | 5 / 8 / 17 |
| Stockroom Serene | 3,604 | 1,605 | 3,429 | 4,685 | 6 / 7 / 18 |

Handoff uses the existing PoC CLI, passes the actual agent-authored candidates and
delivers its **entire** stdout/stderr, including candidate echoes, classifications
and reasons. The enclosing JSON response escapes that stream, so charged response
bytes exceed raw CLI stdout bytes. Raw subprocess sizes are component diagnostics;
they are not added twice. No hypothetical compact serializer savings are subtracted.
Agent request bytes include candidates and final dispositions; internally generated
JSONL input is reported separately. Request + response JSON bytes also increased:
14.0% for ticketing and 36.2% for stockroom, without adding internal transfer twice.

Source text bytes count every delivered line's text without added line separators;
repeated read/search exposures count again. Numbered JSON source wrappers, contracts,
inventories, error messages and handoff output are included in response bytes.
Stage-specific unique line counts are preserved in [scores](scores.json).
These measures exclude model reasoning, full prompts, final chat messages, native
tool envelopes and tokenizer effects. They do not establish total model tokens,
monetary cost or cognitive effort. Recorded wall time is approximately 51/51 seconds
for ticketing and 55/59 for stockroom, but concurrency and orchestration prevent
using that as a model-speed comparison.

## Discovery, matching, actual skip and diagnoses

| Run | Exact Discovery recall / precision | Candidates | JSONL in / out / loss | Ordinary / review-required / violation / unmatched |
| --- | --- | ---: | --- | --- |
| Ticketing Raw | 10/10 / 10/10 | 10 | n/a | n/a |
| Ticketing Serene | 10/10 / 10/10 | 10 | 10 / 10 / 0 | 7 / 1 / 1 / 1 |
| Stockroom Raw | 10/10 / 10/10 | 10 | n/a | n/a |
| Stockroom Serene | 10/10 / 10/10 | 10 | 10 / 10 / 0 | 7 / 1 / 1 / 1 |

All supplied candidate payloads and ordinal correspondence survived handoff. The
two unmatched results are sendSql executions with no-execution-match; neither is
dropped or inferred ordinary. There were zero stale-revision results and zero
coordinate-mismatch results in scored runs. Such cases were tested in the separate
[correctness PoC](../candidate-handoff/README.md), not exercised by this cohort.
No Discovery coordinate repair or missed-site normalization was performed.

| Arm / task | Ordinary full bodies seen during Discovery | Ordinary bodies seen after handoff | Explicit skips with no later exposure |
| --- | ---: | ---: | ---: |
| Raw ticketing | 7 | n/a | n/a |
| Serene ticketing | 7 | 0 | 7 |
| Raw stockroom | 7 | n/a | n/a |
| Serene stockroom | 7 | 0 | 7 |

Thus seven post-handoff omissions per Serene run are real, but **zero ordinary
bodies were avoided across the whole workflow**. Raw had already self-screened the
same constructions and also performed zero review-stage source reads. Serene
ticketing reused source evidence for all remaining candidates; Serene stockroom
reread the unmatched static function. All candidates have complete dispositions.

[Independent adjudication](independent-adjudication.json) confirms each arm diagnosed
the one unsafe concatenation in each task: HTTP-originated phrase affects SQL
syntax in searchTicketing/searchStockroom. Correct dangerous-site recall is 1/1 in
each of the four runs; false findings are zero. Evidence permits construction-line
findings inside the correct function, while Discovery remains exact call-start
coordinates. Safe raw literals and unmatched static SQL were retained and resolved
without being promoted by the handoff to ordinary.

## Errors, evidence and limits

Scored tool errors remain charged: ticketing Raw had two (invalid path and unknown
request fields), ticketing Serene one invalid path, stockroom Raw none, stockroom
Serene three (two invalid regexes and one invalid path). They did not prevent
completion. No scored retry or post-freeze interface correction was performed.
The errors and actual search terms appear in the logs, not silently excluded.

Ticketing Serene's final chat summary incorrectly says five ordinary; the actual
handoff and all seven skip dispositions say seven. Scoring uses the preserved
machine records, not that prose. Final messages are transcribed in adjacent files;
authoritative controller responses and source exposure are in JSONL.

- Exact request/response trajectories: [ticketing Raw](results/tr.jsonl),
  [ticketing Serene](results/ts.jsonl), [stockroom Raw](results/sr.jsonl),
  [stockroom Serene](results/ss.jsonl). Readable transcripts are alongside them.
- [Integrity](integrity.json): frozen materials and audit/handoff/runtime dependencies
  unchanged; all staged roots clean at their recorded revisions with identical source.
- Reproduce scores with python evaluation/end-to-end/score.py; verify integrity
  with python evaluation/end-to-end/verify-integrity.py.
- Recorder regression and paired driver-call equality checks passed before freeze.
  Production code/package exports were not changed, so no new package behavior claim.
- This is a mediated shell-like environment with regex search and read, not an
  unrestricted IDE or semantic/LSP comparison. Full native agent transcript export
  is unavailable; only protocol-mediated operations are comprehensively recorded.
- Two small similarly structured authored applications, one run per cell and one
  danger each give ceiling accuracy and no statistical/generalization claim.
  Labels, task representation and model-specific exploration can change outcomes.
- No live DB, large repository, false-ordinary-danger, missed-discovery or stale input
  was exercised here. Handoff identity still trusts Discovery's execution-candidate
  identification, within the conservative PoC boundary.

## Evaluation checkpoint

The authorized end-to-end comparison is complete. In this tested workflow, the
additional handoff cost exceeded incremental review compression. The earlier
[covered-site ~35% reduction](../triage/covered-study/REPORT.md) remains a separate
conditional result on a supplied post-Discovery set; it does not predict this total.

Keep the adapter evaluation-only. A potential larger-workflow benefit would require
Discovery that exposes less construction content or materially more costly later
investigation, and a handoff whose cost is recoverable; those are hypotheses, not
demonstrated benefits. Production integration, scaling and further studies belong
in separate PRs/tasks. PR #4's evaluation track is now at its requested checkpoint;
the PR remains Draft, with no merge or publication performed.
