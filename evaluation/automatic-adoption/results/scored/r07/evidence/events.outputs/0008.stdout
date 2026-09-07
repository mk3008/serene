Implemented `findProductBySku(db, sku)` in `app.mjs`.

- Rejects SKUs that do not match `^[A-Z]{3}-[0-9]{4}$` before querying.
- Uses a bound SQLite parameter for the SKU lookup.
- Returns a plain object containing `id`, `sku`, `name`, and `on_hand`, or `null` when absent.

Checks passed: `npm test`, `npm run check`, and direct lookup validation.
