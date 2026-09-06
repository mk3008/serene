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
| End-to-end workflow cost | Full Discovery + handoff/triage + review output cost, with stage accounting and maintained diagnosis | [Four new-task Luna/medium runs](end-to-end/REPORT.md): completed response bytes increased 34.0% / 49.9%. All ordinary bodies were already read in Discovery; later skip saved no additional bodies. Discovery 10/10 each, handoff loss 0, danger recall 1/1 each, false findings 0. Small mediated tasks, not general utility or monetary cost. |\n| Adoption instruction | Agents use the construction boundary correctly with minimal instructions | The [nine-run coding pilot](adoption/exploratory/REPORT.md) supports feasibility on three tasks. It did not compare instruction lengths or Rules-only adoption. |
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

The [end-to-end comparison](end-to-end/REPORT.md) completes the requested PR #4
evaluation track. With independent Discovery in the same agent context, Serene
increased total tool-response bytes by 34.0% and 49.9% on two new small applications.
All candidates and diagnoses were retained, but ordinary source had already been
read during Discovery in both arms, leaving no incremental body-read compression
to offset handoff output. Keep this result separate from the supplied-set cohort
below. Productization, larger tasks and additional research move to separate tasks.
PR #4 remains Draft.

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
