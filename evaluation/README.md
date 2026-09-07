# Evaluation questions and evidence boundaries

This is the current research map, following
[PR #4's scope correction](https://github.com/mk3008/serene/pull/4#issuecomment-5559224931).
It supersedes the earlier sequence that treated general defect recall as Serene's
primary effectiveness measure. Historical packets, answers and gold remain intact.

| Question | Outcome that answers it | Existing evidence and limit |
| --- | --- | --- |
| Serene SQL-safety triage | Cost to dangerous-site discovery and discovery within a fixed budget, Serene versus conventional Raw SQL review; required-path recall and unnecessary deep reviews | The original deterministic [coverage study](triage/REPORT.md) measures synthetic tool behavior. The [four-run efficiency cohort](triage/efficiency-study/REPORT.md) records cost on two compact application tasks: its expansion-only primary metric does not resolve the screening/skip contrast. The [covered-site cohort](triage/covered-study/REPORT.md) separates Discovery and records ordinary omission plus response cost; its small reused tasks limit generalization. |
| Discovery mechanics | Observe how agents find execution sites before choosing a triage connection | [Three fresh Luna/medium observations](discovery-mechanics/REPORT.md): rg plus source reads; exact locations 16/16 on small authored tasks. No semantic/LSP tools available; candidate narrowing was mostly unrecorded until confirmation. Supports a thin candidate handoff prototype, not universal tool preference or Serene efficacy. |
| Candidate handoff | Preserve supplied candidates and skip only positive same-revision execution-coordinate ordinary matches | [Evaluation-only JSONL PoC](candidate-handoff/README.md): 24 inputs / 24 outputs, zero loss; 3 ordinary records skip. Fixed boundary cases plus dirty-source and changed-HEAD checks pass. Requires exact column and upstream execution identity; no end-to-end benefit by itself. |
| End-to-end late-handoff cost | Full Discovery + handoff/triage + review output cost, with stage accounting and maintained diagnosis | [Four new-task Luna/medium runs](end-to-end/REPORT.md): completed response bytes increased 34.0% / 49.9%. All ordinary bodies were already read in Discovery; later skip saved no additional bodies. Discovery 10/10 each, handoff loss 0, danger recall 1/1 each, false findings 0. Small mediated tasks, not general utility or monetary cost. |
| Pre-exposure connection | Filter caller-owned search/read responses before ordinary construction bodies reach AI; measure delivered cost and retained discovery | [Response-boundary experiment](pre-exposure/REPORT.md): operation response bytes −43.3% / −31.9%; with loaded prompt text −31.8% / −21.8%. Both Serene runs expose zero ordinary bodies, skip 7, retain 10/10 coordinates and correct diagnosis. The original run exposed a navigation-metadata weakness that the function-metadata successor addresses. Two reused small tasks, not total token cost. |
| Function metadata navigation | Carry authoritative audit function names through ordinary markers while preserving exact execution coordinates and retained review | [Function-metadata successor](function-metadata/REPORT.md): corrected probe and two formal Serene runs retain 10/10 coordinates, skip seven ordinary bodies with zero ordinary-body exposure, and keep three nonordinary sites. Wrong scalar names are eliminated; costs are mixed across two reused tasks, so this is not uniform compression or a general token/product-effectiveness claim. |
| Adoption instruction | Agents use the construction boundary correctly with minimal instructions | The [nine-run coding pilot](adoption/exploratory/REPORT.md) supports feasibility on three tasks. The [prompt-layer study](prompt-layers/REPORT.md) adds a frozen 2×2 coding cell plus export-focused review and authorization pairs; its eight matched runs report artifact correctness, construction adoption, CLI entry, and limited file-event observations separately, without population, cost, causal, or automatic-bootstrap claims. The earlier [automatic-adoption pilot](automatic-adoption/REPORT.md) remains separate. Follow-up: [#6](https://github.com/mk3008/serene/issues/6). |
| SQL layout / provenance ownership | Trace authoritative definition, binding and execution; measure bounded source navigation and native behavior independently of strict status | [Issue #8 decision](layout-ownership/REPORT.md): retain layout-neutral, file-local recognition. Two reused dedicated/colocated pairs pass 20 native SQLite cases; the mechanical route uses 2 versus 1 source reads, while imported candidates remain unresolved. This is not measured human/AI effort. The prior [layout study](adoption/LAYOUT-STUDY.md) is historical and superseded for this issue. |
| General AI code review | Find authorization/business-meaning defects and avoid false accusations | The [12-run review pilot](triage/exploratory/REPORT.md) measured mixed general defect recall, with a ceiling, contract ambiguities and one JSON failure. It cannot answer the Serene triage question. |

## Corrected interpretation of PR #4

The earlier statement that audit did not improve defect discovery over grep referred
to a mixed general-review task. It is not a negative result for Serene's intended
SQL-safety triage utility. Two of three frozen defects per arm were semantic
(tenant scope and business state); their recall must not enter a Serene safety score.
The remaining concatenation defect alone also cannot establish practical triage:
reviewers were asked to inspect all sites, and no prioritization/deep-review cost
was measured. Do not retrospectively relabel this cohort as a safety-triage study.

Imported fixed SQL that receives review-required is unresolved provenance, not
necessarily unsafe SQL or a classification defect. Whether the resulting extra
investigation or strict failure makes a particular layout impractical is a separate
integration question. Its penalty must not be added to a general vulnerability
recall score. No pooled product score combines these studies.

## PR #4 evidence checkpoint

The combined evidence supports a narrower, practical conclusion:

- Serene's recognized construction can reduce **construction-specific** review work when the review workflow consumes the signal before redundant source inspection.
- On supplied post-Discovery sets, the covered-site cohort preserved danger diagnosis while omitting ordinary bodies and using about 35% fewer response bytes to diagnosis.
- A late `AI discovery/read -> Serene handoff` can be counterproductive: the measured workflow increased response bytes after ordinary bodies were already exposed.
- Moving Serene before model-visible source delivery changed that behavior: the pre-exposure experiment preserved exact execution discovery, actionable/unmatched paths and danger diagnosis while exposing zero ordinary bodies. Delivered-content reductions were observed, but the amount varied with agent search/read behavior and repeated metadata delivery.
- Adding authoritative `function: string | null` navigation metadata removed the observed hidden-function naming errors. It did not establish uniform cost reduction.

These are small, mediated workflow results, not proof of universal token, billing,
latency, security, or whole-program coverage gains. The historical pre-exposure
filter remains evaluation-only. The [production library boundary](../docs/pre-exposure-filter.md)
now lets a host filter source before delivery; the host must integrate it into
source-bearing tools. The standalone CLI does not do that automatically.

The earlier [end-to-end late-handoff comparison](end-to-end/REPORT.md),
[pre-exposure experiment](pre-exposure/REPORT.md), and
[function-metadata successor](function-metadata/REPORT.md) must remain separate
results because they test different connection points and participant trajectories.
Do not pool them into a single percentage.

## Earlier conditional evidence

The [covered-site cohort](triage/covered-study/REPORT.md) separates execution-site
discovery from triage of the common discovered set. Discovery exact-location recall
was 21/23 and 23/23; deterministic source-only position reconciliation is recorded
separately. Both Serene reviewers omitted 20 ordinary bodies, retained dangerous
construction detection and used about 35% fewer response bytes to diagnosis than
Raw reviewers. This is a small, explicitly instructed workflow result, not general
utility, exhaustive discovery or minimum-instruction adoption evidence.

The prior [skip-aware rerun](triage/skip-study/REPORT.md) remains the record of
workflow/interface failures; the earlier context-expansion interpretation remains
superseded. All source/gold/answers are preserved, with no pooled product score.
Broader testing would need varied samples and unmatched/false-ordinary controls.
The compact audit CLI option and function navigation metadata are implemented; the
pre-exposure [library boundary](../docs/pre-exposure-filter.md) is now implemented.
Host-specific adapters remain outside this checkpoint.

## Follow-up research

PR #4 stops at this evidence/product checkpoint. Follow-up work is tracked separately:

- [#5 — PR/commit diff pre-exposure filtering](https://github.com/mk3008/serene/issues/5)
- [#6 — automatic AI adoption and minimal Serene instructions](https://github.com/mk3008/serene/issues/6)
- [#7 — productize pre-exposure filtering for AI review tools](https://github.com/mk3008/serene/issues/7)
- [#8 — Rules layout study and cross-file provenance strategy](https://github.com/mk3008/serene/issues/8)

The historical JSONL handoff remains evidence of a safe fail-closed candidate protocol,
but its tested late-handoff workflow added cost; it is not the selected production
integration direction by itself.
