# Prompt-layer adoption probes: report

**Status: complete for eight dispatched runs.** This report records the frozen
prompt-layer protocol results. It does not make causal, population, or automatic-bootstrap claims. The frozen protocol is [PLAN.md](PLAN.md); this report does not
modify its prompts, fixtures, gold, or observer inputs.

## Design and comparisons

The coding cell is a 2×2 matched design over one ordinary customer-email task:
neutral versus the frozen 53-word policy in `AGENTS.md`, crossed with no load cue
versus the explicit instruction to read and follow `AGENTS.md`. The four runs are
C1 (neutral/no cue), C2 (policy/no cue), C3 (neutral/load cue), and C4
(policy/load cue). A preregistered ninth coding probe is eligible only if C2 has
valid feature behavior and no adoption; it uses the neutral policy file and a task
level instruction to use the package.

The export-focused deployment-review pair uses the customer-export fixture with
neutral AGENTS (R1) and the frozen policy AGENTS (R2), both without a load cue. The
authorization pair uses the document-access fixture with neutral AGENTS (A1) and
policy AGENTS (A2), also without a load cue. Each run is reported independently;
comparisons are limited to these matched pairs and the coding cells.

The historical [12-run automatic-adoption report](../automatic-adoption/REPORT.md)
remains a separate packet. Its outcomes are not pooled with this study.

## Run table

| Run | Workflow | AGENTS condition | Load/task cue | Artifact result | Adoption result | CLI entry | Filesystem events (diagnostic) | Notes |
|---|---|---|---|---|---|---|---|---|
| C1 | coding | neutral | none | pass | native binding | 0 | 46 | p01; functional result passed; baseline unchanged. |
| C2 | coding | policy | none | pass | Serene construction | 1 | 116 | p02; functional result passed; baseline unchanged. |
| C3 | coding | neutral | AGENTS load cue | pass | native binding | 0 | 40 | p03; functional result passed; baseline unchanged. |
| C4 | coding | policy | AGENTS load cue | pass | Serene construction | 1 | 76 | p04; functional result passed; baseline unchanged. |
| R1 | export-focused deployment review | neutral | none | pass | n/a | 0 | 54 | p05; export defect identified; source preserved. |
| R2 | export-focused deployment review | policy | none | pass | n/a | 3 | 95 | p06; export defect identified; fixed-path referral retained; source preserved. |
| A1 | authorization | neutral | none | pass | n/a | 0 | 84 | p08; authorization diagnosis correct; native cross-tenant reproduction; source preserved. |
| A2 | authorization | policy | none | pass | n/a | 0 | 51 | p07; authorization diagnosis correct; native cross-tenant reproduction; source preserved. |
| C9 | optional coding | neutral | task-level package cue | not dispatched: trigger not met | not dispatched | not dispatched | not dispatched | C2 had valid feature behavior with adoption. |

## Outcome records

Coding artifact checks passed for the requested customer lookup against the native database, including exact returned fields, absence, blank-input behavior, and the independent inserted-row check. Adoption was native binding in C1/C3 and Serene construction in C2/C4; no harmful rewrite or baseline `listCustomers` regression was recorded.

Both review artifacts contained the required `REVIEW.md` finding for the runtime export path in this export-focused task. The policy review retained the unresolved fixed-path referral; neither review required an exhaustive inventory or ordinary-path mention. The policy review used three CLI entries (help, actionable, and default); this is a process observation, not a review-quality score. The neutral review used none. A suggested downstream-consumer follow-up did not demonstrate an additional defect, and the fixed raw referral was not treated as a vulnerability.

Both authorization artifacts correctly diagnosed the semantic tenant issue in `AUTHORIZATION.md`, left source behavior unchanged, and identified the request-tenant versus actor-tenant binding. Authorization did not require an audit.

CLI-entry records report only whether the participant entered the installed CLI
entry. The hook does not archive participant stdout, stderr, or exit status; a
deterministic parity preflight checks those properties separately. File-event
records above are watcher event totals; they are limited filesystem-activity
observations, not evidence of model receipt, comprehension, or source use. Neither record establishes source reading, use, OS isolation, or a complete
process trace.

## Evidence and provenance

- Final artifact judgments are archived per run in [`judgments/`](judgments/); dispatch, process, and final metadata are in [`metadata/`](metadata/).
- Frozen protocol inputs and hashes are in [`frozen/freeze-manifest.json`](frozen/freeze-manifest.json). Packet parity is recorded in [`frozen/parity.json`](frozen/parity.json); deterministic preflight and cross-exec validation are recorded in [`preflight-record.json`](preflight-record.json) and [`infrastructure-failures/cross-exec-session/record.json`](infrastructure-failures/cross-exec-session/record.json) and its [`correction.json`](infrastructure-failures/cross-exec-session/correction.json). Final archive integrity is in [`metadata/archive-validation.json`](metadata/archive-validation.json); `frozen/archive-manifest.json` is the initial snapshot.
- The participant model configuration was fresh Luna / medium reasoning, with at most two concurrent sessions.
- Runtime packets used the staged Serene 0.1 artifact and TypeScript 5.9.3; staging used no npm installation lifecycle.
- These records report final files and observed process signals, not inferred prompt exposure or unobserved internal reasoning.

## Execution notes and practical interpretation

The first detached-observer attempt failed before dispatch; the later persistent
session fix completed the observer runs. The cross-exec capability probe passed, but
its events still do not establish agent behavior. The preregistered dispatch used
the frozen source at commit `eee958794d1f20327b4972c5dd018fd761686db2`; packet and
observer hashes are recorded in the frozen manifests. Inputs were committed locally
before participant dispatch; remote publication followed the runs. The optional C9 branch was
not eligible because C2 had valid feature behavior with adoption.

For this setup, retain the unchanged 53-word policy candidate in root `AGENTS.md`;
ordinary task prompts need not repeat the package name. The explicit load cue did
not add adoption in these four coding runs, which does not show that such a cue is
unnecessary elsewhere. No instrumented CLI entry was recorded for either authorization run; this is an entry observation, not a complete process trace. An audit may be useful as optional construction inventory, but it is not authorization evidence or a requirement.

## Scope limits

This packet does not estimate a globally minimal policy, automatic repository-rule
discovery, population adoption rates, product effectiveness, total model cost,
latency, billing, or a causal package effect. It does not treat an audit result as
an authorization or business-behavior assurance, infer source exposure from file
events, guarantee a default working directory, or establish automatic repository-
instruction bootstrap.
