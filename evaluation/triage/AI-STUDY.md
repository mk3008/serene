# AI review experiment: follow-up protocol (not run)

> Historical mixed general-review proposal; not the next Serene evaluation.
> The SQL-safety prioritization question is specified in
> [SQL-SAFETY-STUDY.md](SQL-SAFETY-STUDY.md). Semantic defect recall is excluded
> from its primary score. See the [research map](../README.md).

Status: the 48-run protocol below remains unperformed. A separately scoped
[12-run exploratory Luna/medium pilot](exploratory/REPORT.md) is complete. It found
a frozen-defect recall ceiling, one structured-output failure and contract
ambiguities; it does not establish a general AI review benefit. The original
protocol is preserved below for a future separately frozen study.

## Question and controls

Can a reviewer identify concrete defects more often, with fewer false alarms or
less review effort, when Serene provides triage? Keep discovery separate from
correct diagnosis. A flag asking for review is not a correct defect finding.

Use four arms:

| Arm | Input |
| --- | --- |
| A | Native raw-SQL source and its driver binding contract |
| B | Behavior-equivalent Serene source and the narrow Serene contract |
| C | Exactly B's source/contract plus a fixed grep candidate inventory |
| D | Exactly B's source/contract plus the Serene audit inventory |

Primary comparison: D versus C, to test whether triage improves on cheap search.
Secondary: D versus B (tool assistance), B versus A (representation). Never repair a
bug while translating A to B. Unsafe bypasses must remain unsafe bypasses in every
arm. Verify equivalent defects and safe controls before freezing source. If a defect
cannot be preserved, exclude that task before review, record why, and never count
runtime prevention as successful AI discovery.

## Pilot first, then a separately frozen confirmatory study

Start with 12 independently authored tasks, each containing realistic surrounding
application code, safe controls, and zero or more defects. Include defects outside
construction (tenant isolation, wrong binding values, database-side dynamic SQL) to
measure over-trust in ordinary labels. The 40 cases in this PR are development
examples, not held-out tasks and not a substitute for realistic review packets.

Fix an exact model identifier, reasoning setting, context/output budget, tool policy,
prompt, timeout and retry policy before the first pilot invocation. Record actual
model metadata, token/time usage and every failure. Use one fresh independent session
per task/arm; randomize arm order with a recorded seed. No conversation history,
repository access to oracles, neighboring arms, or internet access. Use the same
review instructions and budget. Do not call the source author a blinded reviewer.

A pilot with 12 tasks and four arms means 48 review invocations. It diagnoses ceiling
effects, ambiguous ground truth and workflow problems; it does not establish a
product-wide improvement. Do not repeat until significance appears. Freeze separate
confirmatory tasks, sample size, analysis and meaningful-effect threshold after the
pilot and before confirmatory answers. This PR makes no power/sample-size claim.

## Required prompt and output contract

Use a neutral prompt asking for concrete defects, their locations, explanation and
impact, and an explicit list of inspected SQL execution sites. Explain in every
Serene arm that ordinary refers only to construction, not correctness or exhaustive
coverage. Do not say the tool is expected to improve results.

Require structured output with findings `{file, line, explanation, impact}` and
inspected sites. Do not expose gold labels, case IDs that encode defect classes, or
expected finding counts in reviewer packets. Hash each packet and the exact prompt.
Archive unedited answers, invocation metadata, timeouts and parse failures before
adjudication. Never substitute the current author's reasoning for missing runs.

## Scoring and interpretation

An adjudicator blinded to arm labels maps findings to frozen gold defects using
location plus a correct mechanism. Generic 'review this SQL' or tool-code repetition
alone earns no defect credit. Count discoveries, false alarms, inspected execution
coverage, and missed outside-construction defects separately. Preserve disagreement
and adjudication records; do not silently revise ground truth after answers.

Analyze paired task-level outcomes; multiple findings within one task are not
independent review trials. Primary effectiveness is the per-task fraction of known
defects correctly found; false findings per task and outside-construction misses
are guardrails, not merely secondary presentation details. Report paired differences
and uncertainty using an analysis frozen before the confirmatory run. If multiple
comparisons are tested, predeclare multiplicity handling. No significance calculation
is warranted for this PR's deterministic hand-designed corpus.

A positive finding requires a useful effect without unacceptable false-alarm or
outside-construction regression. Equal recall with less effort may support a narrower
value claim. A ceiling, null result or regression must also be published. Only claim
results for the evaluated model, tasks and budget; do not generalize to all AI code
review or real-world vulnerability prevalence.
