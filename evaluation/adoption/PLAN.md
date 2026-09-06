# Phase 0: adoption experiment preparation

Status: larger protocol remains a candidate; a separately scoped nine-run
[exploratory adoption pilot](exploratory/REPORT.md) is complete.
Author-created SQLite layout preflight is available in [preflight/REPORT.md](preflight/REPORT.md); it is not a model-study result.

Sequence: README PR #2 (merged) -> repository scan PR #3 (merged) -> adoption experiment ->
AI review pilot. Do not infer adoption from deterministic CLI tests or begin the
review pilot before assessing adoption results. Runtime API and raw-sql-rules
remain unchanged by this preparation.

## Questions

What is the smallest instruction that produces correct Serene use without reducing
SQL capability? Does combining Raw SQL Rules with Serene help, duplicate effort,
or conflict with file-local strict triage?

Use 12 implementation tasks per arm. Keep package availability, base application,
driver contracts, schema and functional acceptance checks identical. A no-instruction
arm still has the dependency installed: it measures instruction effects, not package
discovery. Separate the following comparisons instead of conflating all factors:

| Arm | Added repository context |
| --- | --- |
| A | No Serene instruction |
| B | Explicit pointer to README |
| C | One line: Use @mk3008/serene for executable application Raw SQL. |
| D | Minimal default-path and meaningful-loss exception instruction from integration doc |
| E | Exactly D plus ordinary audit in the normal check script |
| F | Exactly D plus strict audit in the normal check script |
| G | Pinned Raw SQL Rules only |
| H | Exactly G plus D's Serene instruction |

Primary comparisons: D/C (exception instruction), E/D (adding ordinary audit),
F/E (making review-required blocking), and H/G (Serene on Rules). F/D is secondary:
it measures the total strict-gate treatment, not strictness alone. D/A and B/A are
exploratory. E and F differ only in `--strict`; source roots, sink names, report
visibility, command invocation opportunity and all other instructions stay identical.
The 96 invocations are a pilot,
not a significance study and not proof of general agent behavior.

## Task requirements before freeze

Independently prepare 12 small realistic feature tasks spanning named native and
positional drivers, repeated parameters, optional filters, finite sorting, arrays,
JSON, inserts/updates, multi-statement application operations, dedicated imported
SQL sources, a custom execution wrapper, and one meaningful-loss exception. Cover
all categories across the 12; do not use the old deterministic challenge corpus as
held-out implementation tasks.

Each task needs runnable baseline, task request, current schema, selected driver
binding contract, hidden behavioral/negative tests and a frozen rubric. Validate
that the exception is real against the pinned Serene version before freezing; do
not invent an unsupported feature. Keep functional acceptance independent of
Serene so compliant native solutions can pass functionality in control arms.
Tests must verify SQL/value separation and preserve required native functionality.
Mocks establish application contracts only; do not report them as live DB probes.

Keep both source-layout compliance and unresolved imported provenance visible in
Rules arms. Strict mode failure is an experimental outcome, not permission to
relax tests, introduce unsafe constructors, move authoritative SQL, or add features.

## Execution gate

Before any scored run, freeze packet/source/test hashes, exact Rules commit/blob,
Serene commit, all instruction bytes, model identifier, reasoning setting, budgets,
timeout/retry policy, runner/version, randomization seed and order. Run an unrelated
connectivity/structured-output preflight first. Use a fresh independent sandbox and
session for every task/arm, exposing only its packet. No author conversation,
neighboring arms, ground truth, external network or iterative author coaching.

Before freezing the runner contract, use an unrelated preflight fixture whose
ordinary audit exits 0 with a known review-required finding. Preserve both the raw
stdout JSON and the actual agent-visible tool response/transcript. Verify that the
coding agent receives the complete findings (including file/line/level/code), even
on exit 0, and can identify that fixture finding in its next response. Run the same
check with strict mode exiting 1. Freeze output forwarding, truncation limits,
artifact access and check-script behavior; use packets small enough that neither
report is truncated. Capturing stdout only in evaluator logs is insufficient.
If success output is hidden, fix the runner before freeze; do not score E as an
audit treatment. A forwarding failure during execution is a treatment-delivery
failure, archived separately from adoption failure, with no silent rerun or relabel.
A Work fresh-agent preflight now confirms this output delivery on one small fixture;
its physical-isolation check failed. See [fresh-agent report](fresh-agent-preflight/REPORT.md).
Do not generalize the forwarding result to larger/truncated reports or scored runs.

Archive unedited outputs, code patches, test/audit results, model metadata, token
usage (null when unavailable), wall time, tool calls and all failures before scoring.
No silent retries or repeated sampling until successful. Blind adjudication to arm
labels where possible; disclose that source style can reveal treatment.

## Outcomes and decision

Score per task: functional correctness; eligible execution sites using Serene;
unnecessary bypasses; justified reported exceptions; harmful SQL rewrites;
Rules/instruction violations; gate outcome; code delta; tokens/time; requests for
human clarification. Use all eligible sites as adoption denominator, not only sites
found by audit. Keep functional success distinct from adoption and gate success.

Record `correct_rules_compliant_import_only_review_required` explicitly: the
functional checks and the pinned Rules rubric pass, but a driver candidate remains
review-required solely because its fixed SQL definition is imported. Adjudicate
this from source, binding/execution checks and diagnostic evidence, not from exit
status alone. Record other findings separately; mark import-only attribution unknown
when evidence cannot establish it. In arms without Rules instructions, rubric
compliance is descriptive, not an instruction obligation.

Separately record gate appeasement: unrequested SQL co-location contrary to the
assigned layout, unnecessary Serene bypass, unsafe escape additions, and concealed
exceptions. Retain the before/after patch, diagnostic, command timeline and agent
explanation so a legitimate planned layout choice is not mislabeled a harmful
rewrite. Report whether a change followed gate failure and whether it changed
functionality, policy compliance or SQL discoverability. Gate pass does not cancel
these failures; no change after a failure is also a recorded outcome.

Report task-paired differences, counts, denominators and every failure. Do not pool
sites as independent trials. Choose the shortest instruction with no harmful
rewrites, no concealed bypasses and correct handling of every eligible pilot task;
if none qualifies, report NOT-YET and the blocking patterns. Even 12/12 is only a
pilot result. Null and negative results are useful. A refinement requires a new
packet freeze and separate results, not replacement of failed runs.

After assessment, choose the instruction/profile for the separately frozen
[AI review pilot](../triage/AI-STUDY.md). Preserve its D versus C primary comparison,
48 independent review runs, outside-construction defects and blinded adjudication.
Do not reuse adoption tasks as held-out review tasks.

## Separate layout comparison and Rules decision

Changing Rules Default 1 is an explicit decision branch, not a predetermined fix
for Serene. Keep the A-H instruction experiment's layout fixed within each task;
do not fold a layout change into F/E or H/G. See
[layout study](LAYOUT-STUDY.md) for the separately frozen dedicated-file versus
operation-colocated comparison, required evidence and proposal gate. Its runs are
additional to the 96 adoption invocations and are not yet scheduled or performed.
Planned co-location under that candidate profile is not gate appeasement; unrequested
co-location in a dedicated-file treatment remains a policy deviation.

## Preparation progress (2026-09-06)

Inspected the current v0.3 draft reference recorded in
[RULES-REFERENCE.json](RULES-REFERENCE.json). Its terminology is Scope + Safety
Contract, with explicit named definition and named caller binding in Default 2.
Do not treat the older v0.2 Contracts wording as the v0.3 frozen contract.

Four paired SQLite specimens and a deterministic verifier are implemented under
[preflight](preflight/README.md). Functional cases, raw CLI reports and trace evidence
are available, but they are author-created development cases. They do not satisfy
independent task authorship, model-output forwarding, blinded adjudication or the
12 implementation packet requirement. Do not promote them into scored runs.

## Execution status (2026-09-06)

The user explicitly authorized an instruction-scoped exploratory Work pilot after
the fresh-agent preflight demonstrated output delivery but no physical filesystem
isolation. Nine independently authored task/arm coding runs are now complete;
see [results and limitations](exploratory/REPORT.md). All passed functionality;
strict audit blocked the two correct dedicated-source implementations in its arm.

This does not fulfill the physical isolation/model metadata gates of the larger
protocol above. Its 96 adoption runs and separate layout study remain unperformed.
The smallest instruction and Rules-only comparison remain open. A separately
frozen [small review pilot](../triage/exploratory/REPORT.md) then completed twelve
Luna/medium sessions. It reached a known-defect recall ceiling and exposed contract
ambiguities and one format failure. Larger replication is not automatic; stronger
task contracts and meaningful discovery difficulty require a new freeze.
Keep Draft status; no Rules change follows from these exploratory counts.

## Model cost preference for subsequent fresh-agent work

The user requested low-cost choices on 2026-09-06. Prefer an explicitly selected
Luna configuration (the completed review cohort used medium effort); use
Terra/medium for bounded checks that warrant it or separately frozen comparison
cohorts. Keep model/effort constant within an experimental comparison. Record
requested aliases and distinguish them from unavailable served snapshot/token
metadata. Do not silently inherit an expensive configuration or retry with a more
expensive model merely to obtain a favorable result.
