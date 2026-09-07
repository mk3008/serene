# Serene layout ownership: bounded decision

Issue #8 supersedes the unexecuted Rules-oriented layout study. This work owns only
Serene's decision. No upstream Rules edits, dependency, copied policy or AI study.

Freeze current main and the external Rules reference before measurement. Reuse two
existing paired SQLite specimens unchanged: `lookup` (one caller) and `shared`
(two operations sharing one authoritative definition within their operation module).
These test one-hop imports and reuse without adding an architecture matrix. They
do not represent multiple caller files, transactions or all application layouts.

For each layout, verify one literal definition, identical function bodies and SQL,
trace the named definition/import through bind to prepare/get arguments, and compare
real SQLite results, SQL and value traces on normal, other-tenant and hostile inputs.
Capture current CLI JSON and exit status for the same `--sink=prepare` configuration,
normal and strict; strict is diagnostic only.

Starting at the known operation module, record a deterministic full-file read path:
read the operation, follow its one direct named SQL import if present, and identify
the tag definition. Count these source reads and import edges; exclude schema,
dependencies and evaluator setup. This measures this mechanical route, not human/AI
effort, minimum discovery cost or a randomized experiment. Audit directory scans
are recorded separately and are not these source-read counts.

Compare two product choices: retain file-local recognition with layout-neutral
guidance, or implement an explicit bounded import mechanism. A layout recommendation
needs review value beyond a better strict exit. An implementation needs a concrete
benefit beyond relabeling the known fixtures, with a coherent source/module identity
contract and fail-closed cases; positive fixtures alone cannot establish that safety.
If both layouts remain directly traceable and the only measured difference is one
explicit import hop plus unresolved static recognition, report that friction and
decide whether it justifies new ownership; do not call it unsafe SQL or hide it.

No candidate recognizer is assumed. If one is proposed, require positive and negative
recognition tests before recommending it. Otherwise record the current boundary's
negative controls and explain why implementation is not justified at this checkpoint.
No universal layout, language, cost, or agent-behavior conclusion is available.
Stop at the smallest defensible Serene decision; fresh AI runs only if an unresolved
behavior question is essential to that decision.
