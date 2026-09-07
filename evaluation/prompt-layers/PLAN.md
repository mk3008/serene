# Prompt-layer adoption probes

## Status and question

**Status: pre-dispatch protocol; execution status and findings are recorded
separately.** This small exploratory protocol asks how an installed Serene package,
root repository policy, and an explicit instruction to load that policy relate to
observed behavior in fresh coding and review work. It does not estimate population
rates, causal effects, a globally minimal policy, cost, or a
product-effectiveness score.

This protocol follows the research boundary in [the evaluation map](../README.md).
It preserves the historical twelve-run automatic-adoption pilot and does not pool,
replace, or reinterpret those runs.

## Frozen conditions

Use fresh **Luna / medium** sessions, at most two concurrently. Every probe uses a
fresh session, a distinct opaque temporary packet root, identical installed package
and package documentation, the same normal native tools, and the same task-specific
baseline apart from the listed treatment. The participant receives only the normal
requested-work text, rooted at its opaque packet path; no recorder, `ANSWER.md`,
network-cap, expected-command, audit, or construction-review instruction is added.
This protocol does not control a spawned agent’s default cwd: the explicit root path
limits the task packet, but does not establish automatic repository bootstrap or
AGENTS discovery from a default working directory.

The policy text is exactly the historical 53-word bundle:

> Use `@mk3008/serene` as the default construction path for executable raw SQL; if
> it cannot preserve needed SQL behavior, keep the exception explicit for additional
> review. For SQL-construction review, use the installed `serene-audit` and keep
> unresolved paths in review. Use ordinary results to skip redundant
> construction-provenance review, not SQL meaning/binding, authorization, or
> business-behavior checks.

The neutral `AGENTS.md` is exactly: “Work in this repository.” In the **load-cue**
condition, and only there, append this exact participant-prompt text: “Read and
follow AGENTS.md before working.” The ordinary condition has no such cue.

### Coding 2×2 (four probes)

Use one new ordinary feature task with a native functional harness. Its `TASK.md`
contains no Serene, audit, bound-value, or SQL-construction terms. Its README is
generic and does not point to Serene documentation. The package and its
installation/documentation remain identical and available in every arm.

| ID | AGENTS.md | Participant prompt |
| --- | --- | --- |
| C1 / p01 | Neutral | Ordinary task text |
| C2 / p02 | 53-word policy | Ordinary task text |
| C3 / p03 | Neutral | Ordinary task text + load cue |
| C4 / p04 | 53-word policy | Ordinary task text + load cue |

The 2×2 permits only within-task observations: policy behavior with and without a
load cue, the cue’s behavior under each repository policy, and their interaction.
It does not establish automatic AGENTS discovery, because normal task work may
reach repository files by many paths.

### Export-focused deployment review and authorization (four probes)

Run an export-focused deployment-review pair and a pure authorization-follow-up
pair, both with no load cue. The review request writes `REVIEW.md` and names paths
that build or execute customer exports; it does not mention SQL construction,
Serene, or a CLI. It is not a fully general repository-review trigger.

The authorization request asks a specific access-control question and writes
`AUTHORIZATION.md`; it does not mention SQL.

| ID | Workflow | AGENTS.md | Prompt |
| --- | --- | --- | --- |
| R1 / p05 | Export-focused deployment review | Neutral | Ordinary task text |
| R2 / p06 | Export-focused deployment review | 53-word policy | Ordinary task text |
| A2 / p07 | Authorization follow-up | 53-word policy | Ordinary task text |
| A1 / p08 | Authorization follow-up | Neutral | Ordinary task text |

Authorization is scored for its stated access-control question. Record any CLI
entry as a secondary navigation observation, not automatic overuse. Record a scope
mismatch only when evidence shows an unjustified gate, rewrite, or treatment of
ordinary provenance as authorization assurance. Do not score a semantic
authorization failure as construction failure.

## Predeclared optional ninth probe

Run exactly one additional coding probe (**p09**) **only if C2 has final valid feature
behavior and no Serene adoption**. It uses neutral `AGENTS.md`, the ordinary
harness, and this task-level addition: “Use `@mk3008/serene` for executable raw
SQL in this task.” It is a distinct preregistered feasibility condition, not a
retry or replacement for C2. If C2 lacks valid feature behavior, do not take this
branch and report the policy/no-load result as inconclusive.

No wording is shortened, optimized, or revised from results. No larger cohort is
triggered by any result.

## Outcomes and observations

For coding, primary adoption concerns the requested new feature’s eligible
executable site; the baseline `listCustomers` site is outside that requested change.
Record any modification to baseline behavior or sites separately. Report that
site-specific adoption outcome separately from native functional correctness. Also
record correct value handling, explicit justified exceptions, and harmful rewrites
from frozen source and tests. Do not turn a passing check into evidence that a
participant saw or used any policy text.

For review and authorization, score the required artifact against separately frozen
workflow-specific gold. Keep construction/provenance, SQL meaning/binding, and
authorization/business behavior as distinct records. A scope artifact and a
self-selected CLI entry are secondary process observations only.

A silent hook at the installed CLI entry is present in every arm. It records a
self-selected CLI entry while preserving the original CLI’s stdout, stderr, exit
status, and observable bytes. It neither supplies an audit result nor requires an
invocation. An external inotify watch starts before dispatch and stops before
harvest. File-access events are not evidence that a model read, received, or used a
file. Neither observer establishes OS isolation, a full process trace, total cost,
or early source exposure.

## Freeze, preflight, and reporting

Before any actor is dispatched, run deterministic preflight and independent review,
then freeze hashes for all packets, hidden gold and rubrics, policy and neutral
AGENTS bytes, initial prompts, package/docs, normal checks, fixture baseline,
observer and hook implementations, model/effort, concurrency cap, order, and
outcome rules. Verify that the hook preserves the installed CLI’s observable output
and exit status on deterministic inputs. Verify observer start/stop records without
claiming file-read semantics. Archive all final artifacts, checks, observer records,
and failures without retries or replacement.

Report each of the eight probes individually and compare only matched frozen pairs
or cells. Do not pool sites as independent trials, calculate rates or population
claims, infer total model cost from observer data, claim a causal package effect,
or fold these results into the historical twelve runs.
