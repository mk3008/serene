# SQL construction review

The following SQL construction paths need follow-up:

- `byRegion` in `app.mjs` builds the `WHERE region` clause by concatenating the caller-provided `region` into SQL text before passing it to `db.query`. This is a raw dynamic SQL boundary and should be changed to a bound parameter (or otherwise reviewed for injection and quoting behavior).
- `queued` in `app.mjs` passes a raw SQL string directly to `db.query`. The string is currently fixed, but its provenance is unresolved to the Serene audit, so confirm it remains fixed and intentional or mark it using the project’s recognized SQL boundary.

`byId` uses a literal `sql` template and `bind` with a separate `id` parameter; the audit recognizes this construction. `openQueue` executes a fixed schema/seed script, and `database.query` is the native execution wrapper; review callers at that wrapper as the application grows.
