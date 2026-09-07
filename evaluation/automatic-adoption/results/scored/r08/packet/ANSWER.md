Implemented `findProductBySku(db, sku)` in `app.mjs`.

- Validates `AAA-0000` SKU format before querying.
- Uses Serene fixed SQL with a bound `sku` parameter.
- Returns the selected product fields or `null` when absent.
- Existing tests, syntax checks, focused lookup checks, and `serene-audit app.mjs` pass.
