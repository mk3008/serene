Discovery completed and recorded (events 1–8). The final snapshot contains five confirmed SQL execution sites:

- `src/gateway.ts:4` — `writeRecord` → `driver.execute`
- `src/gateway.ts:8` — `readRecords` → `driver.query`
- `src/gateway.ts:12` — `openFeed` → `driver.stream`
- `src/warehouseGateway.ts:4` — `recordArrival` → `driver.execute`
- `src/warehouseGateway.ts:8` — `findDock` → `driver.query`

Wrapper callers and aliases were noted. `notes.ts:6` (`driver.prepare`) was excluded per README semantics.
