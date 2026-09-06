# Exploratory fresh-agent pilot: D/E/F

Status: preparation; no outcomes available when this protocol was written.
The user authorized instruction-scoped fresh agents and delegated ordinary method
choices. This is a separately frozen, small exploratory pilot, not the planned
96-run study, the 24-run layout supplement, or the 48-run review pilot.

## Design

Use three independently task-authored JS/native SQLite feature tasks, each with
identical initial code, functionality, schema, public/private tests, dependency
versions and source-layout requirement across three treatments:

| Treatment | Repository check |
| --- | --- |
| D | Public functional tests only |
| E | Same tests plus ordinary Serene audit |
| F | Same tests plus strict Serene audit |

All treatments receive the same short Serene default-path/meaningful-loss exception
instruction and access to installed package documentation. CLI sink configuration is
`--sink=prepare`; roots are `src`. Only F adds `--strict`. No instruction mentions
expected findings, hidden test counts or other treatments. One task permits colocated
SQL; two require dedicated authoritative statement files. Layout is fixed within a
task. Effects of instruction length and Rules-only use are not measured here.

Primary contrasts: E-D (ordinary inventory), F-E (strictness). F-D is descriptive.
Three tasks x three treatments = nine coding invocations, no retries. Randomize the
launch order using Python Random(20260906). Use at most three simultaneous coding
participants. Do not change task tests after seeing coding answers.

## Execution and acknowledged limitations

Each coding participant is a new `spawn_agent` with `fork_turns:none`. Model and
reasoning are inherited without overrides and fixed to that configuration across all
participants. The platform does not provide verified exact model/reasoning IDs or
model token usage here; record null, not inferred names or tool-output token counts.
There is no model-specific generalization or token-efficiency claim.

Use a separate copied `/tmp` packet for each participant. Instruct it to read/write
only that packet, not use network or neighboring artifacts, and not spawn agents.
This is instruction-scoped access, NOT physical isolation; the earlier canary test
proved outside files are readable. No claim of adversarial isolation or independently
attested non-exposure is made. Participants self-report accesses/commands in a log;
root retains finals, patches and evaluator outputs. This is not a complete platform
trace and cannot prove absence of unreported access. Full repository gold tests and
references exist outside participant paths, a disclosed contamination risk.

Task author and coding participants are different fresh sessions; the author does
not review coded outcomes. An additional fresh adjudicator receives anonymized final
sources/requirements, not treatment assignments or coding finals, to assess functional
site inventory, construction use and harmful rewrites. Visible source and layout can
still reveal treatment effects; do not claim complete blinding.

Ask participants for at most 10 shell execution calls and a 12-minute work budget.
These are instruction limits; root will interrupt any run observed past 15 minutes.
The platform does not enforce a total model token cap, so token budget is unavailable.
Record elapsed dispatch-to-final-observation time as orchestration wall time, not
pure model latency, and record any interruptions. Artifact-save retries inside a
single invocation are not additional sampled model runs.

Participants must run `npm run check` after implementation, preserving stdout/stderr
and exit status, and report any remaining gate failure without changing tests/check
scripts/dependencies/layout to appease it. Root reruns public/hidden functional checks
and ordinary/strict inventory after final code submission. Audit findings indicate
construction only, not SQL/business correctness.

## Scoring and decisions fixed before coding

For each task/treatment, report public/private tests, final repository check status,
eligible application prepare/execution sites, Serene use, unresolved import-only
referrals, requested layout compliance, wrong bindings/SQL semantics, prohibited edits,
bypasses, concealed exceptions, final changed files and participant clarification.
Compare complete initial/final source and evaluator outputs; don't infer behavior from
check exit alone. Record gate appeasement only with supporting code/final evidence;
without a complete timeline report causality as uncertain rather than inventing it.

Report all nine outcomes, including failures. Do not run significance tests or treat
multiple sites as independent trials. Review effort and discovery accuracy of general
reviewers are unmeasured. File counts and wall time are descriptive only.

If E preserves correct behavior and F blocks valid imported provenance or induces
harmful changes, recommend ordinary inventory plus explicit additional review for the
measured setup, not universal gate removal. If all are equivalent, report that null
result. Any regression or access-policy deviation remains visible. No Rules revision
or Serene cross-file feature is justified automatically by this small pilot.

The user asked to retain Draft until experiment results. This pilot's results may be
reported while keeping Draft because the wider planned studies are incomplete. No
main merge, package publication or upstream Rules edit is part of this execution.
