# Layout comparison: dedicated file versus authoritative definition

> Historical, unexecuted protocol. Superseded for Issue #8 by the
> [Serene-owned layout decision](../layout-ownership/REPORT.md). The upstream Rules
> proposal and large study below are not current tasks or completion requirements.

> Independent Rules integration/layout track. SQL discovery, binding/execution
> follow-through and layout friction do not enter the Serene safety-triage score.
> See the [research map](../README.md).

Status: AI STUDY NOT RUN; protocol candidate. No isolated model task packets or
model runs have been completed. Author-created paired SQLite preflight evidence is
recorded in [preflight/REPORT.md](preflight/REPORT.md); it is not layout-effect evidence. This study is separate from the A-H instruction
pilot in PLAN.md so layout, instruction and strictness effects are not conflated.

## Treatments and fixed contracts

| Layout | Source rule |
| --- | --- |
| Dedicated | One executable statement per dedicated authoritative source file |
| Colocated candidate | One directly reviewable authoritative definition per statement, permitted beside its caller/access operation |

The inspected v0.3 draft commit/path/blob is recorded in
[RULES-REFERENCE.json](RULES-REFERENCE.json). Include this exact reference (or an
explicitly reviewed replacement) in the eventual execution freeze.
Archive the baseline instruction and the exact Default 1 override. The inspected draft retains the dedicated-file rule. Keep its Scope, Safety
Contract and Defaults 2-4 identical. Report compliance with the unchanged baseline and with the candidate
profile separately. Co-location is not a pass against baseline Default 1.

Both layouts require unique authoritative SQL definitions, directly visible ordinary
SQL, traceable execution sites, meaningful SQL parameter names and caller-side named
binding, current inspectable schema, and a target DB/driver verification path.
No duplicated canonical source, generated mirror, arbitrary runtime SQL or opaque
construction is allowed. Physical file count is an outcome, not a success criterion.

## Matched tasks and controls

Prepare four representative paired tasks before freeze: a single-statement lookup,
a two-statement transaction, a batch operation with at least four distinct application
statements and intermediate result handling, and a feature with multiple call sites
for one authoritative statement. Include safe controls and hidden checks for wrong
named values, missing tenant conditions, execution order and rollback. Define the
statement/site inventory independently of grep and Serene audit.

Use identical SQL semantics, driver, schema, fixture data, requested behavior and
acceptance tests in each layout pair. Preserve transaction boundaries, value mapping,
execution order and result handling; do not fix a defect while relocating a source.
Validate paired fixtures before freezing. Do not force reusable SQL where the task
does not need it; record the effects of the multiple-caller task separately.

Cross each layout with ordinary versus strict audit, giving 4 tasks x 2 layouts x
2 gate modes = 16 coding invocations. Give both gate treatments identical Serene
instructions and complete audit output using PLAN.md's forwarding preflight.
The assigned layout profile is the only layout-instruction difference. Use fresh
sessions and randomized order; freeze source/task hashes, model, reasoning, budgets,
runner, prompts, timeout/retry policy, order/seed and tests before any scored run.
Keep this exploratory supplement separate from the 96-run instruction pilot.

For discovery/review effort, prepare behavior-equivalent fixed review snapshots of
each task/layout before coding runs. Review those in eight additional fresh sessions
(4 x 2), with identical neutral prompts, search tools and budgets. Ask reviewers to
locate every SQL definition and execution site and trace named bindings, transaction,
execution order and result handling. Do not show oracle counts, another layout,
coding transcripts or gate outcomes. This isolates layout review effort from coding
quality; do not silently substitute generated outputs for these frozen snapshots.
Use a blinded adjudicator where possible and disclose that layout itself is visible.

## Evidence and scoring

Archive source and instruction hashes, fixtures/tests, full patches/transcripts,
raw audit stdout plus agent-visible reports, driver/database versions, DB commands
and results, and failed runs. Run the matched functional checks through the actual
selected DB and native driver in a controlled test database. Record affected rows,
returned values, statement order and rollback behavior. A mock-only pass or an
unavailable database is not live DB evidence and cannot satisfy the proposal gate.
Provisioning that requires a new paid service is outside this protocol.

Report paired task-level results, never independent-site statistical claims:

| Outcome | Required record |
| --- | --- |
| SQL discovery | Oracle definitions/sites, found/missed/false candidates, exact search commands and reviewer locations |
| Binding and execution follow-through | Correct named definition/value correspondence; caller, order, transaction and result traces; mistakes and omissions |
| Functional/DB verification | Hidden functional/negative checks and real driver/DB results for both layouts |
| Reviewability invariants | Unique authoritative definition, direct SQL readability, no duplicate/generated/opaque source; Scope, Safety Contract and Defaults 2-4 separately |
| Imported provenance | Functionally correct and profile-compliant cases referred solely due to imports; other causes or uncertainty separately |
| Harmful rewrite/gate appeasement | Unrequested layout change, bypass, unsafe escape or hidden exception, supported by before/after evidence |
| File/review effort | Total source files, files touched, files opened, code delta, time/tokens, clarification requests and trace correctness |

Report layout differences within each gate condition and strictness differences
within each layout. Planned candidate co-location is not a harmful rewrite; moving
SQL against the assigned dedicated-file rule to appease a gate is. Successful gate
status alone is not functional correctness or evidence for changing Rules.

## Decision branches

Before freeze, specify practical tolerances for discovery/trace accuracy and useful
review-effort improvement, with their rationale. Do not select tolerances after
seeing answers. Any loss of Scope/Safety Contract requirements, Defaults 2-4, source uniqueness or live
functional correctness blocks a favorable policy conclusion.

- If the candidate preserves these requirements and satisfies the frozen discovery/
  reviewability tolerances with useful benefit, prepare a separate evidence-backed
  proposal PR against the inspected v0.3 work in raw-sql-rules. Propose replacing the
  dedicated-file default with a directly reviewable authoritative-definition default;
  retain all evidence, failures and scope limitations. Do not merge or silently
  rewrite the upstream policy in this Serene PR.
- If dedicated files show clear advantages outside the tolerances, retain Default 1;
  use the measured friction to decide whether cross-file provenance or reviewed
  exceptions justify a separate Serene change.
- If results are mixed, incomplete or inconclusive, retain the current policy and
  report the uncertainty. A four-task pilot is not broad proof of equivalence.

No policy branch is selected yet. Instruction-scoped Work fresh sessions have
been exercised in other pilots, but this layout study has not been frozen or run;
physical packet isolation remains unavailable.
Real SQLite/Node-driver preflight is available; formal frozen-study DB verification
and any other target DB/driver still require separate execution. See the preflight
report for the narrow observed results and remaining work.
