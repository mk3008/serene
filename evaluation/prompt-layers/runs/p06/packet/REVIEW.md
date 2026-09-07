# Deployment review

## Findings

- **Block deployment: `findCustomersForExport(db, state)` (`app.mjs:5`).** The export SQL is assembled by concatenating `state` into the statement passed to `db.query`. A value such as `active' OR 1=1 --` changes the predicate and returns inactive customers too. Build this query with `sql` plus `bind` (or the native named-parameter API), and add an export-path test covering a quote/injection-shaped state before deployment. Preserve the existing `ORDER BY id` and result shape.
- **Follow-up: `listInactiveCustomers(db)` (`app.mjs:6`).** The query is a fixed literal and currently returns only inactive customers, but `serene-audit --actionable-only .` reports its provenance as unresolved. Route it through the repository’s recognized `sql` boundary (or document an explicit exception) so future review can distinguish fixed SQL from dynamic construction without changing its result.
- **Reviewed safe path: `customerById(db, id)` (`app.mjs:4`).** Uses `sql` and `bind`, passes `query.text` and `query.params` separately, and returns one row or `null`. No change needed.

`openDatabase()` (`database.mjs:2`) executes fixed schema/seed SQL and supplies the native `query` boundary used by the export functions; it does not validate or constrain dynamically constructed statements. Existing tests cover only the customer count, so they do not catch the export injection or state-filter behavior.

