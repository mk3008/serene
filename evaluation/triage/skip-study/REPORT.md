# Compact audit and skip-aware diagnostic rerun

The earlier `3 vs 3` interpretation did not answer the skip question. Context
expansion misses independent screening of ordinary Raw SQL. We retain those logs
but withdraw the inference that they establish absent triage compression.

This correction separates three observations: output reduction, ability to navigate
only actionable paths, and whether fresh agents actually use that ability. The first
two are demonstrated here; the agents in this diagnostic rerun still reread ordinary
source, so this cohort does **not** establish the efficiency of a correctly followed
skip workflow. It identifies workflow uptake and measurement-interface problems.

## Audit output improvement

`serene-audit --actionable-only src` returns candidate execution-site counts plus
non-ordinary findings. Existing full output and exit semantics remain available.
Counts use driver candidates once, not sql/bind/driver rows three times. Non-ordinary
source-boundary findings remain visible even when they are not candidate executions.
The report still identifies coverage and skipped files; it is not whole-program proof.

| Task | Full findings | Compact findings | Counts: ordinary / review-required / violation | Full CLI bytes | Compact CLI bytes |
| --- | ---: | ---: | --- | ---: | ---: |
| Billing | 63 | 3 | 20 / 1 / 2 | 16,612 | 1,132 |
| Warehouse | 63 | 3 | 20 / 1 / 2 | 16,616 | 1,136 |

[Exact output-size comparison](output-comparison.json). This is about 93% less CLI
stdout. These are actual UTF-8 bytes, not invented tokenizer counts or a monetary
saving. Controller responses serialize JSON differently and are measured separately.

## Fresh-agent observations

The [freeze](freeze.json) was pushed at
[116afe5](https://github.com/mk3008/serene/commit/116afe57d2bf6c37d4e7b2613066d1d526898263)
before four Luna/medium sessions, with a 32,768-response-byte budget and identical
targeted navigation in both arms. Tasks and gold were reused unchanged, with fresh
agents. Prior outcomes informed this method revision; this is not new held-out
application evidence and must not be pooled with the previous cohort.

| Task / arm | Ordinary bodies exposed at diagnosis | Ordinary bodies omitted | Response bytes to correct diagnosis | Requests |
| --- | ---: | ---: | ---: | ---: |
| Billing / Raw | 20 | 0 | 25,590 | 24 |
| Billing / Serene | 20 | 0 | 29,348 | 21 |
| Warehouse / Raw | 20 | 0 | 24,075 | 14 |
| Warehouse / Serene | 20 | 0 | 23,462 | 13 |

Both Serene runs had 20 audit-ordinary sites eligible for skipping. **Eligible skip
count is 20; observed omission of ordinary source bodies is 0.** Do not equate them.
Raw screening is now visible as 20 exposed ordinary bodies and charged responses,
not effectively zero because it causes no imported-context expansion. An exposed
body may be an incidental search match, so this is not a mental screening count.

Independent adjudication of shuffled claims without cost metadata accepted all four
construction findings, zero false findings. All found D inside 32,768 bytes; none
submitted the diagnosis before the 4,096 / 8,192 / 16,384 checkpoints. These are
observational checkpoints, not separately run smaller-budget reviews. All three N
bodies and linked contexts were exposed in each run. This is not proof of complete
cognitive investigation. General business bugs and Rules/layout are excluded.

At finish, bytes were billing Raw 25,737 / Serene 32,924; warehouse Raw 28,404 /
Serene 28,692. Billing Serene hit the byte cap: three finish requests were rejected,
and control/error responses account for overshoot. Its valid discovery remains at
29,348 bytes. No replacement run or invented successful finish was substituted.

## Why ordinary source was reread

Both Serene agents admitted in separately archived post-run explanations that full
store reads were broader than necessary. They reported no contrary evidence or
missing navigation requiring ordinary-body review. We did not subtract these costs
or alter their findings based on retrospective explanations.

Billing Serene also performed broad searches before audit and supplied a file path
to audit three times, expecting per-file audits. The controller's audit operation
was project-wide and silently ignored that extra argument. Each returned the same
report. This is a controller-contract usability defect, not evidence that the actual
CLI requires repeated audits: the real CLI accepts explicit file targets. The old
support warning about non-exhaustive coverage contributed to broad discovery, according
to that agent. A coverage check and rechecking already recognized constructions are
different tasks; the study did not cleanly induce that distinction in behavior.

Warehouse Serene returned an empty ordinary_reread_reasons field despite its full
read, then acknowledged the overbroad read on follow-up. Three final answers were
prose rather than requested JSON. Original tool finding submissions are retained and
scored independently; these output/strategy failures are not silently repaired.

The first correction therefore measures actual output and source exposure more
honestly, but it did not produce the intended audit-first selective-review workflow.
It cannot be used to conclude that Serene's skip ability has no value.

## Targeted navigation is possible without ordinary bodies

A separate **post-outcome engineering probe**, not an AI participant, read the
contract/support, called compact audit once, and requested context at each returned
actionable location. It used no gold to select locations. Both tasks delivered the
three actionable contexts with zero ordinary bodies: 4,464 bytes for billing and
4,381 for warehouse, including finish. It did not diagnose a vulnerability and must
not be compared with AI diagnosis cost as if it did.

[Probe code](navigation-probe.py) and [output](navigation-probe.json) demonstrate that
whole-store retrieval is unnecessary. They do not demonstrate that agents will use
this path or that all unknown execution routes have been covered.

The probe also exposed a coarse index edge: an import line between two functions was
inside the prior function's indexed span. The engineering probe excludes import-only
exposure when reporting bodies. Frozen participant aggregation remains unchanged;
all four participants exposed actual SQL bodies of all 20 ordinary controls anyway.
Any future study must fix this boundary rather than treating incidental import
exposure as screening. That post-outcome diagnostic is not a rewritten frozen metric.

## Evidence, tests and next boundary

`npm run check` passed for the CLI change, including regression coverage for compact
counts and retained actionable rows. Three new controller tests cover targeted reads,
exact serialized-response accounting and byte-cap withholding; agent-visible synthetic
calibration verified compact counts and function delivery. Calibration did not exercise
misunderstood per-file audit parameters; its missing finish is preserved in the log.

[Raw responses and final answers](results/summary.json), independent adjudication and
post-run explanations remain separate. Run `aggregate.py` to reproduce the primary
summary. `results/cost-categories.json` additionally partitions response bytes by
ordinary-only / N-only / mixed source exposure, audit, other source and control/error;
mixed responses are not arbitrarily allocated between screening and follow-through.
All source/gold/prompt/tool freeze hashes remain unchanged after dispatch. Mediation
is instruction-based, model-token usage unavailable, and the two compact tasks have
no zero-danger control. These limits prevent general product-effect claims.

Before another efficacy cohort, validate an explicit audit-first workflow, clarify
project-wide versus file-scoped audit arguments, reject unsupported parameters, and
allow termination after a cap without repeated failed finish requests. Verify that
ordinary omission actually occurs during calibration and use accurate function spans.
Do not spend more scored runs merely repeating the same strategy failure. This is a
method/uptake prerequisite, not a request to expand Serene into whole-program analysis.
Keep PR Draft; no Rules or SQL-construction runtime changes were made. The production
change here is the authorized CLI output option.
