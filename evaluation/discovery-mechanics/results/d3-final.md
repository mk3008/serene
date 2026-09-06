D3 discovery is complete. I followed the recorder protocol and finished with 5 confirmed actual execution sites (final snapshot event 7; finish event 8):

- `src/ledgerStore.ts:7` — `LedgerStore.addEntry` → `session.execute`
- `src/ledgerStore.ts:11` — `LedgerStore.entriesFor` → `session.query`
- `src/ledgerStore.ts:15` — `LedgerStore.eraseDraft` → `session.execute`
- `src/maintenance.ts:4` — `pruneJournal` → `driver.execute`
- `src/reporting.ts:9` — `journalFeed` → `driver.iterate`

Discovery used README inspection (event 2), file listing (event 3), text search (event 4), and source inspection (event 5). Wrapper callers and `transaction`/`prepare` were noted and excluded because the README says they do not themselves invoke statements. No semantic index or language server was available.
