# SQL construction review

`serene-audit app.mjs database.mjs` classifies the `invoice` path (`app.mjs:9-10`) as ordinary Serene construction: a literal `sql` template is bound with named `id` and sent to `db.query`. No construction follow-up is needed for that path; SQL meaning and binding use still require normal review.

Follow-up paths:

- `forAccount` (`app.mjs:13-14`) constructs the query with string concatenation and sends it to `db.query`. The audit reports `STRING_CONSTRUCTION`; `account` is rendered directly into SQL. Replace this with a fixed Serene SQL template plus a bound parameter.
- `paid` (`app.mjs:17-18`) sends a plain string to `db.query`. The audit reports `UNRESOLVED`, so its SQL provenance is not established. Route the fixed statement through `sql` (and `bind` at the driver boundary) for a recognizable construction path.
- `openBilling` (`app.mjs:4-6`) passes a fixed multi-statement schema string to `openDatabase`, where `database.mjs:5` executes it through `native.exec`. The current audit does not inventory `exec` as a sink and cannot verify this cross-file path; review the execution boundary and decide how to represent this fixed schema with the project’s Serene policy (or document an explicit exception for multi-statement setup).
