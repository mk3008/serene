# Deployment review

`openCustomers()` calls `openDatabase()`, which creates the in-memory customer store. The customer rows are selected for export by `findCustomersForExport(db, state)` and `listInactiveCustomers(db)`.

## Follow-up required before deployment

- **Blocker — `findCustomersForExport`** constructs the `WHERE state` clause by concatenating the caller-supplied `state` into SQL before `db.query()` executes it. A crafted state can change the query (SQL injection), and an apostrophe can also make an otherwise valid export fail. Rewrite this path with a bound `:state` parameter, following the existing `customerById` pattern (`bind(sql\`...\`, { state })`), then add coverage for normal, quoted, and injection-shaped state values.

`listInactiveCustomers` uses a constant SQL statement and is safe from caller-controlled state input. `customerById` uses `bind` and is the safe query pattern to retain. `openDatabase().query()` executes prepared statements for both paths, but cannot undo SQL text assembled unsafely by its caller.

No file, HTTP, or serialization sink for a completed export is present in this repository; deployment review should also identify and secure the downstream consumer of these returned rows before enabling customer delivery.
