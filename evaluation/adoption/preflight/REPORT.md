# Layout preflight report

Status: deterministic fixture preflight PASS; AI adoption/layout studies NOT RUN.
No recommendation to change Raw SQL Rules follows from this report.

## Recorded environment and scope

Run on 2026-09-06 using Node v24.19.0, native `node:sqlite` and SQLite 3.53.3.
All databases were real isolated in-memory SQLite databases. No mock engine,
external service, paid model call or independent AI reviewer was used.
Raw output, SQL/value/control traces, before/after database snapshots, source hashes
and exact CLI commands are in [results.json](results.json). The source revision in
that artifact identifies the committed verifier/fixtures used for the recorded run.

The inspected Rules draft is [v0.3 at 6edd3b7](https://github.com/mk3008/raw-sql-rules/blob/6edd3b7805304db7c356a1d285a47448062d32f2/raw-sql-rules.md),
blob `ed45b86efaf088141f41ec7de9c150fa3f521ee9`. It retains dedicated source files
in Default 1 and explicitly requires named definitions and named caller binding in
Default 2. This is a draft reference, not a release or execution-freeze assertion.
No upstream Rules file was modified or vendored into Serene.

## Observations

Four author-created paired scenarios pass 28 functional cases in total. The SQL
literals, results, database state, named arguments and execution/control traces
match within every layout pair. Six deliberately incorrect behaviors are rejected
by the same evaluator: wrong tenant, wrong amount, missing transaction, reversed
batch order, missing batch rollback, and incorrect second-caller binding.

| Scenario | Definitions / execution sites | Dedicated / colocated source files | Ordinary audit exit (both) | Strict exit (dedicated / colocated) |
| --- | --- | --- | --- | --- |
| Account lookup | 1 / 1 | 2 / 1 | 0 | 1 / 0 |
| Transfer | 2 / 2 | 3 / 1 | 0 | 1 / 0 |
| Batch fulfillment | 4 / 4 | 5 / 1 | 0 | 1 / 0 |
| Shared lookup, two callers | 1 / 2 | 2 / 1 | 0 | 1 / 0 |

Source-file counts include only each specimen's `src`, excluding the identical
schema, data, transaction helper, dependency and evaluator. They are physical counts,
not measured files touched, files opened, review time, or development effort.

The `--sink=prepare` candidate configuration detects all nine known application
prepare sites in each layout. Every dedicated-layout candidate is review-required
with unresolved imported provenance; every colocated candidate is ordinary. Both
modes emit complete JSON in this CLI capture; only strict mode blocks the dedicated
layout. There are no violation findings. The oracle site counts were declared in
catalog.json; this is not a claim of general sink coverage.

Functional checks include hostile parameter strings, other-tenant lookups/targets,
insufficient funds, wrong stock, duplicate orders, request-order results and rollback
of earlier successful writes when a later batch step fails. No concurrency, network
failure, other SQL dialect, positional-driver behavior or production workload was
verified by this preflight.

## Interpretation

These fixtures establish that the imported-provenance gate difference can occur
without a difference in the tested SQLite behavior. They provide runnable material
for validating the eventual runner's success-output forwarding. They do not show
that any coding agent received the report, appeased a gate, preferred a layout or
performed a better review.

Manual inspection finds one visible authoritative definition per statement in each
specimen, named definition/caller binding, current DDL and an actual DB/driver test
path. The colocated specimens deliberately customize Default 1; they are not claimed
to satisfy its unchanged dedicated-file requirement. Passing these examples does not
prove that the broader policy objectives are preserved across application styles.

The same author prepared both source and evaluator. These are calibration cases,
not independent/held-out tasks or a blinded study. No study tolerances were frozen
and no model inference was scored. Zero model runs were performed; agent-visible
output delivery remains unverified. Keep PR #4 Draft.

## Remaining execution gate

1. Provide a configured independent coding-agent runner with exact model/reasoning,
   budget and output-delivery metadata. `codex` is absent from this workspace's PATH;
   no such study runner is currently configured.
2. Prepare the 12 actual implementation tasks and isolated packets, keeping gold
   implementations and private tests outside participant access. These completed
   specimen implementations are not implementation requests.
3. Independently validate packet behavior, declare layout-study tolerances and
   freeze model/task/source/budget/order. Validate exit-0 and exit-1 report forwarding
   in the real agent transcript before scored invocation.
4. Run and adjudicate the adoption/layout studies, preserving failures and negative
   results; decide whether to proceed to the separately frozen AI review pilot.

The 28 preflight cases do not replace any of the planned model invocations. The
upstream policy decision remains open until the stipulated evidence is available.
