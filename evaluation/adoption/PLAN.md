# Phase 0: adoption experiment preparation

Status: NOT RUN; protocol candidate, not a frozen execution packet.

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
This preflight has not yet run.

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

## Current execution blocker (2026-09-06)

In this Work workspace, `codex` and `gh` are absent from PATH; no callable independent
model-runner tool is exposed. Node/npm and repository access work. No model API
credentials were sought, no paid calls were started, and no fresh agent runs were
performed. The active author session is not a substitute for an independent runner.

The next environment must provide an authorized independent coding-agent runner and
its model/budget metadata. Then prepare/validate the 12 packets, freeze them and run
the preflight before the 96 adoption invocations. This file supplies a protocol,
not runnable tasks, an implemented runner, or adoption evidence. Phase 1 remains
pending the Phase 0 decision.
