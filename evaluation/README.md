# Evaluation questions and evidence boundaries

This is the current research map, following
[PR #4's scope correction](https://github.com/mk3008/serene/pull/4#issuecomment-5559224931).
It supersedes the earlier sequence that treated general defect recall as Serene's
primary effectiveness measure. Historical packets, answers and gold remain intact.

| Question | Outcome that answers it | Existing evidence and limit |
| --- | --- | --- |
| Serene SQL-safety triage | Cost to dangerous-site discovery and discovery within a fixed budget, Serene versus conventional Raw SQL review; required-path recall and unnecessary deep reviews | The original deterministic [coverage study](triage/REPORT.md) measures synthetic tool behavior. The [four-run efficiency cohort](triage/efficiency-study/REPORT.md) records cost on two compact application tasks: its expansion-only primary metric does not resolve the screening/skip contrast. The [covered-site cohort](triage/covered-study/REPORT.md) separates Discovery and records ordinary omission plus response cost; its small reused tasks limit generalization. |
| Discovery mechanics | Observe how agents find execution sites before choosing a triage connection | [Three fresh Luna/medium observations](discovery-mechanics/REPORT.md): rg plus source reads; exact locations 16/16 on small authored tasks. No semantic/LSP tools available; candidate narrowing was mostly unrecorded until confirmation. Supports a thin candidate handoff prototype, not universal tool preference or Serene efficacy. |
| Candidate handoff | Preserve supplied candidates and skip only positive same-revision execution-coordinate ordinary matches | [Evaluation-only JSONL PoC](candidate-handoff/README.md): 24 inputs / 24 outputs, zero loss; 3 ordinary records skip. Fixed boundary cases plus dirty-source and changed-HEAD checks pass. Requires exact column and upstream execution identity; no end-to-end result. |
| End-to-end workflow cost | Full Discovery + handoff/triage + review output cost, with stage accounting and maintained diagnosis | [Four new-task Luna/medium runs](end-to-end/REPORT.md): completed response bytes increased 34.0% / 49.9%. All ordinary bodies were already read in Discovery; later skip saved no additional bodies. Discovery 10/10 each, handoff loss 0, danger recall 1/1 each, false findings 0. Small mediated tasks, not general utility or monetary cost. |
| Pre-exposure connection | Filter caller-owned search/read responses before ordinary construction bodies reach AI; measure full delivered cost and retained discovery | [Response-boundary experiment](pre-exposure/REPORT.md): operation response bytes −43.3% / −31.9%; with loaded prompt text −31.8% / −21.8%. Both Serene runs expose zero ordinary bodies, skip 7, retain 10/10 coordinates and correct diagnosis. Two reused small tasks, not total token cost; optional function-name annotations can be wrong. |
| Function metadata navigation | Carry authoritative audit function names through ordinary markers while preserving exact execution coordinates and retained review | [Function-metadata successor](function-metadata/REPORT.md): corrected probe and two formal Serene runs retain 10/10 coordinates, skip seven ordinary bodies with zero ordinary-body exposure, and keep three nonordinary sites. Costs are mixed across two reused tasks; it makes no general token or product-effectiveness claim. |
| Adoption instruction | Agents use the construction boundary correctly with minimal instructions | The [nine-run coding pilot](adoption/exploratory/REPORT.md) supports feasibility on three tasks. It did not compare instruction lengths or Rules-only adoption. |
| Rules integration / layout | Dedicated versus colocated definitions preserve discovery, binding/execution follow-through and DB behavior; imported-provenance friction and file/review effort | [SQLite preflight](adoption/preflight/REPORT.md) and coding results reproduce import-only strict failures. There is no controlled AI layout-effect result. See [layout plan](adoption/LAYOUT-STUDY.md). |
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

## Current evidence and evaluation checkpoint

The latest authorized question is the [pre-exposure connection](pre-exposure/REPORT.md):
intercept search/read responses before ordinary construction source reaches the AI.
The caller still chooses discovery primitives and scope. Keep primitive match-row
preservation, independently scored execution Discovery, and ordinary skip separate.

The earlier [end-to-end comparison](end-to-end/REPORT.md) remains the result for a
later handoff: output increased 34.0% / 49.9% after ordinary bodies had already been
read. The new connection is a different workflow, not a retrospective correction
of those results. PR #4 remains Draft; no pooled product score.

## Earlier conditional evidence

The [covered-site cohort](triage/covered-study/REPORT.md) now separates execution-site
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
The authorized compact audit CLI option remains implemented. Keep Raw SQL Rules and
SQL-construction runtime unchanged. Keep PR #4 Draft.

## Function metadata successor checkpoint

The completed [function-metadata successor](function-metadata/REPORT.md) adds authoritative `function: string | null` navigation metadata to default audit findings and ordinary markers. Its corrected probe and formal `ts`/`ss` runs each retained 10/10 coordinates, skipped seven ordinary bodies without exposing them, and retained three nonordinary sites. The first probe remains preserved and excluded for full-declaration annotation errors; optional disposition-name omissions are separate from wrong names. Controller and prompt-inclusive costs are mixed across the two reused tasks, so this is not evidence of uniform compression or a general token-cost result. PR #4 remains Draft.
