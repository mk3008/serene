# Reservation Confirmation

Implement `confirmReservation(db, { tenantId, reservationId, expectedVersion, note }) -> {reservationId,status,note,version} | null` in `src/operation.mjs` using Node's built-in `node:sqlite` DatabaseSync API. The database is supplied by the caller.

Atomically confirm a pending reservation only when tenant_id, reservation_id and version match. Set status to confirmed, replace note with the exact supplied string, and increment version by one. Return exactly reservationId,status,note,version for the updated row, or null when absent, stale or already confirmed. Never modify another tenant. Inputs are valid. Each application SQL statement must have its own dedicated authoritative .mjs source file under src/sql, imported by operation.mjs. Keep SQL directly readable in that file without duplication; a named exported raw string or another fixed literal representation is allowed. Transaction control statements are exempt and may remain in operation.mjs. Bind all input values with meaningful named parameters. Schema/setup/assertion SQL in tests is exempt.

Use the existing schema in `schema.sql`; `seed.sql` provides example data. Do not change the schema or public tests. No external dependencies are required. Run `npm test` (Node 24 or newer).
