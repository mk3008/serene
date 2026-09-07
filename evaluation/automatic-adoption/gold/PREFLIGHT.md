# Fixture preflight

All six packet roots were copied to fresh temporary directories, populated by `prepare-package.mjs install` with the packed local Serene artifact, then run with `npm test` and `npm run check`. Every public command passed. Those commands invoke only Node test and syntax checks; no audit command appears in package scripts.

The construction and authorization packets use `database.mjs`, a minimal adapter over native `node:sqlite` whose `query(text, params)` executes `DatabaseSync.prepare(text).all(params)`. Against the frozen staged sources, `serene-audit app.mjs` reported the following:

| Packet | Ordinary execution | Other execution findings |
| --- | --- | --- |
| calibration construction review | `byId` at 10:10 | `byRegion` violation at 14:10; `queued` unresolved referral at 17:10 |
| billing construction review | `invoice` at 10:10 | `forAccount` violation at 14:10; `paid` unresolved referral at 18:10 |
| calibration authorization follow-up | `caseById` at 10:9 | none |
| invoice authorization follow-up | `invoiceById` at 10:9 | none |

The full frozen findings, including Serene construction coordinates, are in each packet's `audit-expected.json`. Manual-review rubrics grade claims and cited functions, not source-text matching. Coding acceptance reports its SQL behavior and its pre-query input-validation behavior as separate results.
