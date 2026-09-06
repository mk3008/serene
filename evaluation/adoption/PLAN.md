# Phase 0: adoption experiment preparation

Status: NOT RUN; protocol candidate, not a frozen execution packet.

Sequence: README PR #2 (merged) -> repository scan PR -> adoption experiment ->
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

Primary comparisons: D/C (exception instruction), E/D and F/D (gate), H/G
(Serene on Rules). D/A and B/A are exploratory. The 96 invocations are a pilot,
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
