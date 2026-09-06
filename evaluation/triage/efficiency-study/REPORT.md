# First SQL-construction efficiency cohort

**Interpretation correction following [the review](https://github.com/mk3008/serene/pull/4#issuecomment-5559806349):**
The recorded numbers below remain valid observations of this interface. They do not
establish that construction-triage compression was absent, even in these tasks:
3 versus 3 expanded sites omits the difference between independent Raw screening
and audit-supported omission of ordinary construction checks. Bytes charge actual
rereads but do not explain whether the interface/prompt made them necessary. The
whole-file investigate operation and full audit output also added avoidable context.
The original interpretation below is retained for provenance and is superseded on
that point. See the [skip-aware correction](../skip-study/PROTOCOL.md).

Four fresh Luna/medium sessions completed after the pre-dispatch freeze at
[4971d6a](https://github.com/mk3008/serene/commit/4971d6aa63a9b7d725f17fe3cdb4652b55f7796e).
On these two compact application tasks, the recorded context-expansion count and
fixed-budget discovery did not improve with Serene. Both ordinary Raw reviewers
also screened the fixed SQL without expanding its context. This is a scoped cost
result, not a conclusion from equal final recall alone, and not a general verdict
on Serene's utility in larger applications.

## Cost to the first submitted correct diagnosis

The original finding requests, timestamps and delivered content are preserved in
[results](results/summary.json). Independent construction-only
[adjudication](adjudication.json) checks correctness against frozen gold; helper-origin
reports count when they identify the actual execution chain. No finding is backdated
to an earlier source read. Bytes include screening, support and audit payloads.

| Task / arm | Expanded sites | Successful reads / searches / context retrievals / audits | All requests | Payload bytes | Elapsed seconds |
| --- | ---: | --- | ---: | ---: | ---: |
| Billing / Raw (e04) | 3 | 4 / 1 / 0 / 0 | 7 | 14,048 | 37.00 |
| Billing / Serene (e03) | 3 | 5 / 0 / 2 / 1 | 12 | 42,726 | 34.59 |
| Warehouse / Raw (e01) | 3 | 4 / 1 / 2 / 0 | 12 | 26,074 | 39.41 |
| Warehouse / Serene (e02) | 3 | 5 / 1 / 2 / 1 | 12 | 49,830 | 31.12 |

Elapsed time includes scheduling/orchestration and is not CPU time or model-token
cost. Serene was faster on this wall-clock measure, while its payload was larger
in both pairs. Neither observation alone establishes a robust efficiency benefit.
The frozen practical signal (at least 20% fewer expanded sites or better discovery
within B, without coverage/false-finding regression) was not observed.

All four correctly diagnosed the one dangerous execution path before B=10. At the
observational checkpoints B=1/3/5/10, discovery was 0/1/1/1 in every run. These are
checkpoints of the B=10 trajectories, not independently rerun smaller-budget agents.
N context coverage was 3/3 in every run, and expanded sites outside gold N were 0,
both at diagnosis and finish. Context exposure is not proof of explicit resolution
or a measurement of mental depth. Do not promote this to 100% human-like N review
recall. Full-file reads expose multiple linked functions at once, limiting resolution.

Each task has 23 actual execution sites: 20 fixed constructions and three paths
needing imported-helper/caller follow-through. The wrapper caller is normalized to
helpers.send, not counted as a second execution. Finite choices visible at the call
site are not N. The imported finite chooser requires helper inspection and is N;
its safe resolution is not an unnecessary investigation. Both arms exposed the
chooser, dangerous predicate and forwarding wrapper. No ordinary fixed site had
recorded context expansion. Audit cannot be credited with removing 20 deep reviews
that the ordinary reviewers never performed.

## What changed after the review

The old repeated 100-site fixtures were used only for transport/budget calibration.
A fresh Terra/medium author prepared new billing and warehouse tasks without earlier
participant answers. A uniform AST conversion reads Raw source, never gold, and
converts every eligible literal query. Native SQLite verification matched SQL,
values and results for 62 paired executions, including the dangerous witnesses.
An independent Terra/medium validator checked the site inventory and oracle.
Preparation corrections remain in evaluator notes; there was no post-answer repair.

The logger records source ranges and search hits, automatically counts linked context
exposure, and charges actual reads/searches/bytes as well as explicit investigate
calls. Both arms have the same literal/regex/case-insensitive search facilities.
Seven controller regression tests passed. Source, prompt, budget and requested model/
effort were frozen and pushed before the four scored sessions. There were no scored
retries or model substitutions. Runtime, audit behavior and Raw SQL Rules are unchanged.

## Limits and deviations

- These are independently prepared but small illustrative applications, three JS
  files each, with similar structures and one dangerous site each. They are not
  sampled production repositories. There is no zero-danger task; easy Raw screening
  and correlated task difficulty limit conclusions about harder workloads.
- The proxy measures exposed context, not actual attention. It can overcount a
  full-file read and miss private reasoning. Initial source screening is charged
  through bytes/actions even when no context expansion occurs.
- Mediation is instruction-based, not filesystem isolation. All four agents reported
  following it; unchanged packet hashes establish no mutation, not absence of every
  unlogged read. Served model snapshots and token usage are unavailable.
- The independent adjudicator received run IDs and task mapping rather than shuffled,
  anonymized cases; collection files also contain costs, although instructions said
  not to use them. This departs from the intended blinded handoff. Independence is
  retained; blinding is not claimed. Original logged claims remain inspectable.
- Missing SUPPORT.md in Raw, attempts to audit Raw, nonexistent guessed files and
  investigate calls targeting helpers without their own sink caused failed requests.
  All are retained and charged as requests/time. The interface's direct-sink-only
  investigate operation created friction in both arms. It was not changed mid-run.
- e02 issued a status request after finish. The log retains it; terminal cost uses
  the first successful finish (49.02 seconds), not that later closed-session error.
- The two failed HTTP calibration sessions remain archived. Replacement file-backed
  calibration was separate from scored work. One calibration participant miscounted
  audit findings; an explicit count field and follow-up delivery check addressed this
  before freeze. These failures are not efficacy results.
- The immutable controller finding submissions are the timing/scoring evidence;
  final conversational prose is not used to infer earlier discoveries or dispositions.
  Per-path marginal costs cannot be cleanly assigned when a read exposes all three N
  paths; report joint exposure rather than fabricated individual-resolution costs.

## Reproduction and decision

Run `python evaluation/triage/efficiency-study/aggregate.py` to reproduce objective
summaries from archived events. `collect.py` archived the original controller logs
and protected-file comparisons. These post-run scripts are separate from the frozen
participant tools. Preserve the frozen source-hash manifests and earlier cohorts.

This cohort establishes that the corrected workflow can capture discovery cost, but
provides no positive compression signal on these tasks. It does not justify changing
Serene's runtime, adding cross-file analysis, changing Rules/layout, or concluding
that triage is useless. A broader study would need naturally varied, larger contexts
and zero-danger controls, with calibration of this proxy's coarse full-file exposure
behavior before another freeze. Keep this PR Draft; do not expand the experiment or
reinterpret the old mixed business-bug cohort as supporting evidence.
