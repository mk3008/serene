# Specimen Search

Implement `findSpecimens(db, { tenantId, category, since, limit }) -> Array<{specimenId,label,collectedAt}>` in `src/operation.mjs` using Node's built-in `node:sqlite` DatabaseSync API. The database is supplied by the caller.

Return only non-archived specimens for the exact tenant and category with collected_at >= since (inclusive). Sort collected_at descending, then specimen_id ascending. Apply limit after filtering and sorting. Dates are ISO YYYY-MM-DD; limit is a positive integer. Return exactly specimenId, label, collectedAt fields. Inputs are valid. Bind every input using meaningful named parameters; do not interpolate values. Application SQL may be colocated in src/operation.mjs.

Use the existing schema in `schema.sql`; `seed.sql` provides example data. Do not change the schema or public tests. No external dependencies are required. Run `npm test` (Node 24 or newer).
