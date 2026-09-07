Implemented `findContactByEmail(db, email)` in `app.mjs`.

- Rejects malformed email values with `TypeError` before preparing a query.
- Uses Serene fixed SQL with a bound `:email` parameter.
- Returns the matching contact or `null` when absent.
- Seed data is unchanged.

Checks passed: `npm test`, `npm run check`, and `serene-audit app.mjs`.
