# Maple task contract

`listProjects` serves an authenticated tenant member. It returns projects belonging to `ctx.tenantId`, optionally filtering by `archived` (a boolean) and choosing `name` or `created_at` ordering. Unknown order choices use `created_at DESC`. Runtime values are untrusted and must be bound; finite order choices may select reviewed SQL terms.

`projectById` returns one project only from the authenticated tenant, using the supplied project ID as a bound value. `projectTotals` returns counts for the tenant and may include archived projects. Every database operation must include the tenant predicate where project rows are read. `db.query(text, namedParams)` passes SQL and values unchanged to native SQLite, returns row arrays, and throws on SQL errors; SQLite interprets `:name` markers.
