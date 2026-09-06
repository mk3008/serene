Discovery completed and recorded (events 1–9). I found six confirmed direct driver execution sites:

- `src/catalog.ts:4` — `listShelf`, `pool.query`
- `src/catalog.ts:8` — `renameSku`, `pool.execute`
- `src/receipts.ts:4` — `receiptFor`, `client.query`
- `src/receipts.ts:8` — `markEmailed`, `client.execute`
- `src/reconcile.ts:4` — `postCounts`, `driver.batch`
- `src/reconcile.ts:11` — `clearStaging`, `pool.execute`

`src/main.ts:7-12` contains wrapper callers. `prepare` and SQL string builders were excluded per README semantics.
