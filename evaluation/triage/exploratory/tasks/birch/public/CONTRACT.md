# Birch task contract

`listInvoices` serves an authenticated tenant administrator. It must return only invoices belonging to the authenticated tenant, with optional status filtering. The tenant context is authenticated and supplies `tenantId`; request query values and sort input are untrusted. Status is one of `open`, `paid`, or `void` when present. Results may be sorted by `issued_at` or `total_cents`; the default is newest issued date. An unknown sort key should use the default.

`findInvoice` serves an authenticated tenant member and must return the requested invoice only when it belongs to the authenticated tenant. Invoice IDs are untrusted strings and the database should receive them as values. The application-owned `db.query(text, namedParams)` passes SQL and values unchanged to native SQLite, returns row arrays, and throws on SQL errors; SQLite interprets `:name` markers.

The handler should return rows on success and let database errors reach its caller. No other authorization or schema assumptions apply.

`invoiceSummary` is also tenant-admin-only and must count non-deleted invoices belonging to the authenticated tenant.
