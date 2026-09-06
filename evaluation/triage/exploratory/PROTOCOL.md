# Small exploratory review pilot

Status: preparation; freeze manifests and commit before dispatch.

This is a separately scoped 3-task × 4-arm (12 review sessions) feasibility pilot,
not the proposed 48-run study in ../AI-STUDY.md. Adoption's nine-run feasibility
assessment precedes this stage. Independently authored new tasks are used; no
adoption task or prior development corpus is recycled as held-out review material.

A receives raw source and driver/business contract; B receives behavior-equivalent
Serene source and its narrow contract; C is B plus fixed grep inventory; D is B plus
full Serene audit inventory. Primary comparison is D/C; D/B and B/A are secondary.
The grep expression is `\b(query|execute|prepare)\s*\(`, applied per source line.
Audit uses the frozen installed CLI with `--sink=query source.mjs` and full JSON.
Both are candidate inventories, not gold defect labels. The common review prompt
asks for concrete defects and inspected execution sites without expected counts.
B/C/D receive identical source and narrow contract. Planted bypasses stay raw.

Request gpt-5.6-luna with medium effort and fork_turns:none for every participant.
This records a requested model alias, not an independently verified served snapshot.
Authoring also requested Luna/medium. Do not silently substitute a model mid-cohort;
if unavailable, archive failure and plan a separate cohort (Terra/medium is the
user-approved lower-cost alternative). Exact tokens and enforced output-token
budget are unavailable. Ask for at most 1,200 words and three shell calls, ten
minutes work; root interrupts at an observed 15-minute ceiling. These are requested
limits, not a physically enforced model token cap. No retries or coaching.

Use seed 20260908 to shuffle task/arm order. Run up to three reviews concurrently.
Expose only one packet, no network, neighbors, gold or author conversation; the
filesystem boundary is instruction-scoped, not enforced. Reviewers read source and
contracts and write answer.json only; no code execution or source modification.
Preserve exact prompts, packet hashes, requested model/effort, dispatch/completion
observations, failures, unedited answers and final messages. Timing includes Work
orchestration and is not clean model latency. Token cost remains null.

Before freeze, verify raw/Serene SQL and parameter parity by capturing query calls,
including each exported function, branch and hostile values. This is mock-wrapper
pairing evidence, not live DB validation. Independently inspect gold and contracts
for unintended defects and preserve all pre-freeze correction history. Freeze gold
and source before any scored answers; never repair defects in conversion. One task
is a safe control. Smaller-than-planned source sizes and conspicuous defects may
produce ceilings; publish them rather than repeatedly sampling to obtain an effect.

Score against frozen gold using both correct location/function and mechanism.
Inventory labels or generic review warnings earn no defect credit. Deduplicate
multiple descriptions of the same defect. Count concrete unsupported bug claims
as false positives; record suggestions/uncertainties separately. Report each task's
recall, outside-construction misses, false positives and inspected execution sites.
Zero-gold recall is N/A; use that task for false alarms and coverage. Missing or
unparseable answers are failures, not dropped runs. Sites/findings are not
independent experimental trials. Report counts and paired task differences only,
without significance or population-wide benefit claims.

A fresh adjudicator receives shuffled anonymous outputs plus necessary source,
contracts and frozen gold, without treatment labels or inventory. Source style or
quoted diagnostics may still reveal treatment: qualify blinding accordingly.
Root checks scoring against the frozen rubric and retains disagreements. Author
or root reasoning must not replace missing reviewer outputs. No minimum-instruction,
Raw SQL Rules policy-change or multi-driver claim follows from this pilot.

If all arms reach a ceiling or D/C shows no practical difference, do not spend on
an automatic larger replication. Record the result and concrete design limitations;
a harder task set or another model requires a separate freeze and rationale.
Keep PR #4 Draft; no runtime or upstream Rules changes are part of this experiment.
