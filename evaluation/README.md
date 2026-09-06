# Evaluation questions and evidence boundaries

This is the current research map, following
[PR #4's scope correction](https://github.com/mk3008/serene/pull/4#issuecomment-5559224931).
It supersedes the earlier sequence that treated general defect recall as Serene's
primary effectiveness measure. Historical packets, answers and gold remain intact.

| Question | Outcome that answers it | Existing evidence and limit |
| --- | --- | --- |
| Serene SQL-safety triage | Cost to dangerous-site discovery and discovery within a fixed budget, Serene versus conventional Raw SQL review; required-path recall and unnecessary deep reviews | The original deterministic [coverage study](triage/REPORT.md) measures synthetic tool behavior. The [four-run efficiency cohort](triage/efficiency-study/REPORT.md) records cost on two compact application tasks: equal context expansion and budget discovery, higher Serene payload bytes. It is not production-wide evidence. |
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

## Current next step

The first [SQL-safety efficiency cohort](triage/efficiency-study/REPORT.md) is complete.
It compares conventional Raw SQL with uniformly converted Serene code and available
audit, using logged reads/searches/context expansion and a fixed budget. Neither pair
showed the frozen compression signal; equal final recall is not the sole basis for
that result. See the report for secondary costs, proxy limitations and deviations.
The [overarching study](triage/SQL-SAFETY-STUDY.md) remains the research contract.
Retire the mixed [AI-STUDY.md](triage/AI-STUDY.md) as the next Serene evaluation;
it remains a historical general-review proposal. Layout work stays independent.
Any larger cohort needs a new task/tool freeze; preserve all previous source/gold.
Keep Raw SQL Rules and Serene runtime/audit unchanged. Keep PR #4 Draft.
