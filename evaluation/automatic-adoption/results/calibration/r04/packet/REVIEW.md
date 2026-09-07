# SQL construction review

Follow-up is needed on these construction paths:

- app.mjs:13-14 (byRegion) builds the SQL statement by concatenating region into a quoted string before passing it to db.query. Serene classifies this execution site as a violation (STRING_CONSTRUCTION). Replace it with a fixed sql template and a separately bound region parameter, then review the resulting SQL and binding.
- app.mjs:17 (queued) passes a raw SQL string directly to db.query. serene-audit classifies the site as review-required (UNRESOLVED) because it cannot establish SQL provenance. Mark this as a fixed Serene construction (with binding if parameters are added) or otherwise document the reviewed construction path.
- database.mjs:5 (openDatabase) executes its schema argument through native.exec. This is an executable SQL boundary outside the audit default query/execute/unsafe candidate names. The current caller supplies a fixed schema literal, but the helper accepts arbitrary text; review the helper callers and keep schema input fixed or explicitly constrain this path.

app.mjs:9-10 (byId) is recognized as ordinary Serene construction, so it does not need construction-provenance follow-up. SQL meaning, parameter use, and authorization still require their normal review.
