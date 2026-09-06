# Layout fixture preflight

These are author-created development/calibration fixtures, not independent authors'
held-out tasks or frozen coding-agent packets. Do not reuse them as confirmatory
review tasks. They make the proposed layout/gate failure mode reproducible before
paying for model runs. No model was invoked.

## Reproduce

From the repository root, after `npm ci`:

```sh
npm run build
node evaluation/adoption/preflight/verify.mjs /tmp/serene-layout-preflight.json
```

Use Node with `node:sqlite` available; the recorded run uses Node v24.19.0 and
SQLite 3.53.3. The verifier creates only isolated in-memory databases and optionally
writes the requested JSON evidence file. It never connects to an external database.
This is real SQLite/Node native-driver execution, not PostgreSQL/MySQL/SQL Server
coverage and not a multi-client/concurrency test.

The [Node SQLite API](https://nodejs.org/docs/latest-v24.x/api/sqlite.html) exposes
`DatabaseSync.prepare` and statement `get`/`run` methods with named bindings. Fixtures
pass `bind(...).params` directly, leaving SQL text and values separate. Evaluation
instrumentation records the arguments then forwards them unchanged to native SQLite.
It does not emulate SQL. The only application helper owns BEGIN/COMMIT/ROLLBACK;
these control statements are exempt from application-query source separation.

## Contents and evidence boundary

- `fixtures/`: four independent *scenarios* in two source layouts; both versions
  remain author-written, paired development fixtures. Each layout is a separate
  application specimen, not two authoritative copies inside one application.
- `catalog.json`: behavioral requirements and explicit definition/execution counts.
- `schema.sql`, `seed.sql`: directly inspectable schema and deterministic data.
- `support.mjs`: application-owned transaction helper shared across specimens.
- `verify.mjs`: matched functional cases, trace/snapshot comparison, oracle sensitivity
  checks and real CLI invocation with raw stdout capture.
- `results.json`: recorded raw evidence; `REPORT.md`: interpretation and limitations.

The verifier checks literal SQL equality between each pair, results/database state,
named arguments, and execution/control traces. Six deliberately wrong behaviors
(wrong tenant/amount, missing transaction/rollback, reversed order, wrong second
caller binding) must be rejected by the oracle. These checks do not prove complete
business correctness or statistical representativeness.

The configured candidate name is `prepare`, because the selected driver prepares
SQL before invoking `get`/`run`. This is candidate inventory, not proof that all
possible native-driver execution paths are discovered. Ordinary/strict commands use
identical source roots and sink names; only `--strict` differs.

Capturing exit-0 stdout here verifies CLI emission only. It does not verify that a
coding agent received or understood it. The agent-visible forwarding preflight,
independent model sessions, blinded adjudication, budgets and tolerance freeze in
PLAN.md and LAYOUT-STUDY.md remain required. These fixtures are not ready to be sent
as coding tasks: implementations and evaluator oracles are present in this repository.
A future packet builder must isolate only the assigned task and public context,
provide actual requested changes, and keep reference implementations/oracles private.

Do not infer policy change from a green preflight. This evidence establishes a
mechanism on these four SQLite scenarios; it does not establish comparative SQL
discovery, human/AI review effort, adoption rate, or broad equivalence of layouts.
