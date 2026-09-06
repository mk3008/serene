# Discovery-separated covered-site triage

On the same AI-discovered and source-reconciled set, both Serene reviewers skipped
all 20 matched ordinary construction bodies and diagnosed the dangerous path after
about 35% fewer response bytes than their Raw counterparts. This is scoped evidence
for the covered-site skip workflow on two small reused tasks, not a general efficacy
estimate or evidence of exhaustive discovery.

The key difference from the earlier runs is operational: discovery happened first,
and its misses were evaluated separately. Both reviewers then received the same set;
Raw screened it, while Serene used matched compact audit to replace individual
ordinary screening. Discovery uncertainty no longer instructed reviewers to redo
recognized construction checks. Prior cohorts remain preserved and are not pooled.

## Discovery is a separate result

| Application | Exact locations found | False reported locations | Source-only normalization |
| --- | ---: | ---: | --- |
| Billing | 21/23 | 2 | Two correctly named functions were wrongly placed in api.js; unique AST function-name matching locates them in store.js. |
| Warehouse | 23/23 | 0 | None needed. |

The billing error includes the dangerous function's location. It is not removed from
Discovery scoring or counted as perfect discovery. Original agent JSON and the exact
normalizations are archived. No missing function name was invented or filled from
gold. The deterministic matching rule was introduced after seeing the location error,
which is an adaptive preparation step, disclosed rather than called preregistered
Discovery methodology. Triage uses the normalized 23 IDs in both arms. Its scores
are conditional on that supplied set, not a replacement for the Discovery result.

## Covered-stage cost and coverage

Four fresh Luna/medium sessions ran after
[43f4cb7](https://github.com/mk3008/serene/commit/43f4cb708cce2c931bf1384ba42e79ce7394e707)
was pushed. Correctness was adjudicated independently using shuffled claims and raw
source/gold, without cost metadata. All four submitted construction findings are
correct; false findings: zero.

| Task / arm | Ordinary bodies exposed at diagnosis | Ordinary bodies omitted | Response bytes to diagnosis | Requests to diagnosis | Terminal response bytes |
| --- | ---: | ---: | ---: | ---: | ---: |
| Billing / Raw | 20 | 0 | 11,941 | 29 | 12,692 |
| Billing / Serene | 0 | 20 | 7,701 | 10 | 7,986 |
| Warehouse / Raw | 20 | 0 | 11,610 | 12 | 12,821 |
| Warehouse / Serene | 0 | 20 | 7,529 | 10 | 7,676 |

Response bytes to correct discovery decreased 35.5% in billing and 35.2% in warehouse.
All site-list, contract, audit, source, status and error responses are charged; these
are actual serialized UTF-8 bytes, a token proxy, not tokenizer counts or model bills.
Raw source screening is no longer represented as zero work. Counts concern exposure
of exact AST function bodies, not private attention or reasoning duration.

At terminal review, Raw exposed all 23 site bodies in each task; Serene exposed the
three actionable bodies and omitted the other 20. All three gold N paths were exposed
by finish, with finite-choice and wrapper provenance resolved safely. Billing Raw
submitted the dangerous finding before reaching the safe forwarding wrapper; its
first-hit N body count is 2, not inflated to its terminal 3. Both Serene runs covered
all 3 N bodies before their finding. No unnecessary ordinary source-body reread was
observed in either Serene run.

| Response-byte checkpoint | Raw correct discoveries | Serene correct discoveries |
| --- | ---: | ---: |
| 4,096 | 0/2 | 0/2 |
| 8,192 | 0/2 | 2/2 |
| 16,384 | 2/2 | 2/2 |
| 32,768 (actual cap) | 2/2 | 2/2 |

These are observations along the same 32,768-byte trajectories, not independently
rerun smaller-budget sessions. Equal final recall is not the efficiency conclusion:
the observed differences are skipped bodies, charged response cost, and earlier
arrival in the byte trajectory. Elapsed times are archived but include orchestration
and are not used to claim a model-speed or CPU advantage.

## What was verified before scoring

Two fresh calibration agents used a distinct three-site example. Objective logs
show Raw reading all three bodies, Serene reading only the actionable body and
omitting both ordinary bodies; both recorded a correct construction finding and
finished. This **behavioral gate**, not output delivery alone, passed before freeze.
Final calibration prose was not the requested JSON, and one participant's reported
byte total differed from the controller; objective logs determined the gate and cost.

The new controller rejects unknown audit arguments, returns exact AST function spans
without the earlier adjacent-import overlap, and allows finish after caps. Four
regression tests cover targeted ranges, argument rejection, charged errors and
post-cap termination. No conditions changed during scored sessions or failed sessions
were replaced. All four scored runs returned JSON and finished. Invalid navigation
requests remain charged in the logs rather than silently repaired.

## Audit reconciliation and limits

The real `--actionable-only` CLI supplies compact actionable output. An internal
full-output coordinate pass matches the discovery set to driver-candidate rows; its
ordinary details are not given to agents. Both Serene tasks match ordinary 20,
review-required 1, violation 2, with zero unmatched inputs. Input-set reconciliation
is evaluation harness functionality, not a newly shipped manifest/API. The index,
matching table and report are frozen and use source positions, not gold labels.

The workflow explicitly requires investigation of unmatched inputs, but these tasks
contain none: unmatched-path effectiveness remains unmeasured. No zero-danger or
false-ordinary-danger control is present. These are two compact, similarly shaped,
reused tasks, not a fresh production sample. Clear audit-first instructions are part
of treatment. The result is not spontaneous minimal-instruction adoption evidence.

Discovery and internal matching preparation costs are separate from covered-stage
response cost. The result is not an end-to-end wall-time saving including those steps.
Shared filesystem access is controlled by instruction, not physical isolation; source
hashes establish no mutation, not proof of every unlogged read. Served model version
and token usage are unavailable. Small-sample percentages are descriptive, with no
significance calculation or pooled site-level trials.

## Evidence and process correction

- [Protocol](PROTOCOL.md), [freeze](freeze.json), [calibration gate](calibration-gate.json)
- [Discovery scores](discovery-scores.json), [original/reconciled input sets](discovery-reconciliation.json)
- [Audit matching evidence](audit-reconciliation.json), [source/tool configuration](run-config.json)
- [Measured trajectories](results/summary.json), [independent adjudication](independent-adjudication.json)

Run `aggregate.py` to reproduce the primary summaries. Original request/response logs
and final answers are stored separately. The controller finding event sets discovery
time; final prose is not backdated. Earlier source/gold and this freeze remain intact.

The user's instructions were sufficiently clear. The orchestrator failed earlier to
separate the research questions and make actual treatment behavior a prerequisite for
scoring. More tests or independent agents do not validate a mismatched research design.
The corrective process is to specify the comparison and behavioral gate, demonstrate
it cheaply, and only then freeze and score. No comparable Astra-versus-other-model
experiment exists here, so model superiority/inferiority cannot be inferred from this
thread. This assessment is also recorded in the requested PR comment.

Keep PR Draft. No Rules/layout or general business-bug outcomes are mixed in, and
this turn changes evaluation only. The earlier compact CLI output improvement stays
available. Broader generalization would require varied application samples and explicit
unmatched/false-ordinary controls; these four runs do not establish those claims.
