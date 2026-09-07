Implemented `findContactByEmail(db, email)` in `app.mjs`.

It validates email input before preparing a query, binds the email through Serene/native named parameters, returns the matching contact, and returns `null` when absent. Seed data is unchanged.

Checks passed: `npm test`, `npm run check`, and manual found/missing/malformed lookup checks.
