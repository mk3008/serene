# SQL-safety review triage efficiency

Status: candidate protocol, NOT RUN. Scored execution requires review of the
[pre-freeze materials](efficiency-preflight/REVIEW.md) first. No scored packets or numeric budgets are
frozen. This revision follows [the efficiency correction on PR #4](https://github.com/mk3008/serene/pull/4#issuecomment-5559333838).
The [research map](../README.md) keeps adoption, Rules layout and semantic review
separate. Earlier mixed-review results cannot answer this question.

## Primary question

Does adopting Serene reduce the work needed to reach a correct SQL-safety finding,
or increase the chance of reaching one within the same review budget, while
preserving coverage of paths that genuinely require construction investigation?

Equal final dangerous-site recall is not equal efficiency. Finding the same one
hazard after 80 deep investigations versus 6 is potentially a substantial benefit.
Finding it more often within a 10-site investigation budget is another benefit.
These numbers illustrate the estimand; they are not results or frozen budgets.

The scope is SQL syntax control and construction/provenance evidence. Ordinary
means a candidate for skipping additional construction investigation, not permission
to skip tenant, authorization, business-value or other application review. Those
semantic outcomes never enter the primary score. Rules integration/layout effects
remain a separate track, with no combined product score.

## Primary comparison: ordinary workflow versus Serene adoption

| Arm | Code and available review workflow |
| --- | --- |
| R: conventional | Native Raw SQL application; normal source navigation, search/grep and locally available review tools |
| S: Serene | Behavior-equivalent application using Serene for eligible construction paths, plus available audit; the same ordinary navigation/search tools |

Do not force R to use grep, a fixed candidate list, or a full review of every site.
It may recognize safe native binding, prioritize intelligently and stop when its
review is complete. S may use audit but is not instructed to trust it blindly or
required to use it. Archive actual tool use; failure to use available audit is an
adoption/workflow observation, not permission to coach or replace a reviewer.

This primary contrast measures the total review effect of adopting Serene, including
its source representation and available audit. It cannot attribute that effect to
audit alone. A separately frozen optional comparison on identical Serene source
with/without audit (or with a grep inventory) can isolate assistance; it is secondary
and not a prerequisite. Avoid adding those arms to the first cohort by default.

Hold task behavior, native driver, schema, input domains, surrounding code, source
layout, ordinary tools and review budgets constant within each pair. Preserve exact
SQL, value separation, call order and dangerous behavior when translating to Serene.
Do not repair a hazard through conversion: an unsafe path must remain an explicit
bypass with the same behavior. If a hazard cannot be preserved, record exclusion
before freeze. No forced dedicated/colocated relocation, strict gate treatment or
Rules instruction difference is allowed in this comparison.

Both arms get the same neutral SQL-safety review objective and output requirements.
Only S gets the narrow Serene contract and audit availability instructions; include
reading that material and generating/reading audit output in its review cost.
Exclude installing/adopting the library from review-time cost and disclose that
separate adoption cost. The contrast does not establish total lifetime savings.

## Independent task and truth preparation

Use independently authored application-sized repositories containing many resolved
fixed/bound paths, a smaller set needing additional provenance investigation, and
some dangerous paths. Include zero-hazard controls and variation in concern density
and finding difficulty. Freeze those proportions and source placement before scored
runs; do not generalize a deliberately sparse challenge set to production prevalence.
Vary identifiers/order across tasks to avoid planting hazards at a predictable end.

Gold is independent of audit and candidate inventories. Enumerate every true SQL
execution site and non-SQL lookalike. Assign stable evaluator-only site IDs linking
R/S variants; participant filenames and IDs must not disclose class or count.
Freeze separately:

- D: genuinely dangerous construction sites, backed by a concrete untrusted-syntax
  mechanism and executable witness where applicable.
- N: sites requiring additional construction/provenance investigation under the
  stated evidence contract, including dangerous and genuinely unresolved paths.
- Resolved paths: sufficient fixed/finite-syntax and separate-binding evidence;
  additional construction deep investigation is not required by that contract.

Give N a common conceptual definition across variants; record the actual available
evidence for each variant. Serene's provenance evidence is part of its treatment,
not a reason to redefine the denominator after running audit. A safe path requiring
tracing can belong to N and resolve safely. Report its justified investigation cost
separately from avoidable work on an already resolved path. No forced safe/unsafe
answer for genuinely unavailable external evidence. Pure import-only layout-friction
specimens stay in the layout track rather than determining the primary result.

Verify SQL/value/behavior equivalence, site inventory, driver semantics, input types,
authenticated context shape and required evidence with a separate validator before
freeze. State which executable checks capture calls and which run the native DB.
Do not substitute intended defects for validated truth, or use semantic bugs to
make the task harder. Include false-ordinary cases only if independently reproducible;
do not fabricate them. Keep frozen gold unchanged after answers.

## Observe the review trajectory

Give both arms normal source search/navigation through the same instrumented tool
surface. Log chronological searches, file/range reads, result bytes, elapsed tool
time, audit generation/consumption and reviewer findings. Inventory reading and
initial source scanning are work: count them even before any deep investigation.
Do not preload all source and then count only later named actions as effort.

Define a deep investigation before freeze as a site-targeted attempt to establish
syntax origin, trust/validation of dynamic fragments or the construction-to-driver
path beyond inventory/brief screening. Require an explicit site reference when
starting such an investigation, and corroborate it with subsequent recorded reads
or source-based reasoning. Distinguish opening a file from investigating every
site in it. Shared wrapper reads may support several sites: charge the read once,
record all linked sites and retain repeated investigation events separately from
unique deep-investigated-site counts. Semantic-only investigation is out of scope.

Record discovery, correct diagnosis and final reporting separately. Mere exposure
to a dangerous line or repetition of a violation label is not a discovery. The
first time-stamped finding with a correct mechanism, source location and impact
is the dangerous-site discovery event, subject to independent adjudication.
Later findings cannot be backdated to an earlier read. Use a common brief progress
record in both arms so reporting checkpoints are comparable; log their overhead.

The tool surface must capture reads/searches reliably before scored runs. Self-
reported site lists alone, aggregate Work wall time, or hidden evaluator stdout
cannot establish review-effort savings. Broad reads remain allowed within the same
byte/time limits and are charged; if a reviewer reasons about many sites without
observable site-level actions, report that measurement limit rather than zero work.
Unlogged access makes affected cost/budget outcomes invalid and remains an archived
measurement failure. Do not claim physical isolation from fork_turns:none.

## Fixed budget and comparable stopping

Use one frozen maximum unique-site deep-investigation budget B per task pair, plus
matching elapsed-review-time and total source/search-output-byte caps. Define cap
precedence, permitted tool actions and the exact logger-enforced stopping mechanism
before dispatch. Choose B and caps with unrelated calibration, so reviewing every
site deeply is not the default; calibration is development evidence, not scored data.
Reviewers do not see gold counts or expected stopping targets.

Follow each trajectory until its common cap or the reviewer's declared completion.
Measure both (a) cumulative cost at its first correct dangerous-site finding and
(b) discovery/recall by the frozen budget checkpoints. This permits cost-to-discovery
and fixed-budget assessment from the same run without favorable reruns. Do not
stop an arm early because the evaluator privately knows all hazards were found.
Repeated reads do not add unique sites but still consume time/byte/action costs.

No-hit runs are right-censored at their actual stop/cap; never assign them a zero
cost, drop them, or compare successful runs alone. Report success probability by
budget together with censored trajectories. Zero-danger controls contribute
unnecessary-work and false-finding outcomes, not a fictional time-to-danger value.
Freeze numeric B, checkpoints and all other caps before any scored answer; no model
runs start while these fields or the logging mechanism remain unspecified.

## Co-primary efficiency outcomes and guardrails

| Measure | Required result |
| --- | --- |
| Cost to dangerous-site discovery | Unique deep-investigated sites up to and including the first correct hit; repeated actions, searches/reads/bytes and reliable elapsed time reported alongside; no-hit censoring explicit |
| Discovery under fixed budget | Fraction of task-runs with a correct dangerous-site finding by each frozen checkpoint and B; dangerous-site recall at B for multi-hazard tasks |
| Coverage guardrail | D recall and N referral/investigation recall separately, including unlisted sites and dangerous paths incorrectly dismissed as ordinary |
| Unnecessary construction investigation | Unique resolved sites deeply investigated and repeated events/cost; denominator is independently resolved paths, not audit's ordinary count |
| Category breakdown | Work spent on audit-ordinary paths and on resolving review-required paths, mapped to matched R sites; split justified versus unnecessary using gold |
| Unresolved work | Referrals resolved safely, confirmed dangerous, or still unresolved with evidence; measure review-required resolution cost without treating uncertainty as a defect |
| False safety claims | Unsupported dangerous findings and unjustified safe dismissals, separate from useful referrals |
| Overall measured cost | All screening plus deep-review read/search actions, bytes and tool overhead; wall time with queue/orchestration limits disclosed; tokens only if available |
| Delivery reliability | Missing logs, format failures, cap overruns and incomplete/truncated output separately preserved |

Report category breakdowns descriptively; audit labels must not define truth. Work
on a falsely ordinary dangerous site is justified, not an inefficiency penalty.
A review-required path resolving safely may also have justified cost. Analyze paired
task outcomes and cost-versus-coverage trajectories; do not treat sites as independent
trials or collapse safety and efficiency into one weighted score.

Equal terminal recall with materially lower measured investigation cost can support
efficiency. Greater discovery within the same budget can also support it. Prespecify
practical effect thresholds and acceptable coverage/false-claim tolerances before
scored answers. A cheaper workflow that misses required paths is not automatically
a win. If final recall is equal but effort was not reliably measured, efficiency is
unknown, not equal. Preserve null/regression findings and distinguish recall ceilings
from cost ceilings. No significance or production-wide benefit claim from a tiny pilot.

## Freeze and completion boundary

Before new scored runs, produce a concrete reviewable freeze of paired source/oracle
hashes, task count/densities, calibrated B/time/byte caps/checkpoints, effect thresholds,
reader/logger version and visibility evidence, available ordinary tools/audit version,
exact prompts, model/effort, randomized order, retries/timeouts and adjudication rubric.
Validate that ordinary and deep-review work are actually counted in both arms and
that budget limits apply equally. This document itself is not that execution freeze.

Use explicit Luna/medium fresh sessions for the first cohort; Terra/medium is an
option for warranted bounded validation or a separate cohort. Keep participant
model/effort fixed. Record served-metadata/token limits honestly. No silent retry,
model substitution, post-answer truth revision or paid-service provisioning.
Independent adjudication receives anonymous evidence without treatment labels where
possible; disclose that source style can reveal representation. Archive all failures.
Keep historical evidence, runtime behavior, upstream Rules and PR #4 Draft unchanged
while preparing this corrected efficiency experiment.

## Pairing review before execution

Review paired fixtures, D/N gold, numeric B/time/byte caps and the instrumented
logger before scored runs, as requested in PR #4. Apply a documented syntax-based
conversion consistently to every eligible construction, without consulting gold.
Keep filenames, function names, layout, surrounding code and dangerous behavior
matched wherever possible. Record every unavoidable representation difference.
A source author who knows gold must not add clues, comments or special wrappers
only around dangerous sites. The reviewer must be able to inspect the transformation
and equivalence evidence. The subsequent [user instruction](https://github.com/mk3008/serene/pull/4#issuecomment-5559536423)
ended the extra plan-review gate and authorized correction, calibration, freeze and
execution. The [first cohort report](efficiency-study/REPORT.md) records that execution
and its limits; the historical preflight materials are not scored evidence.
