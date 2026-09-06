# Pairing verification

Reviewed each raw/Serene pair site by site. Every pair has the same exported functions, guards, input normalization, branches, selected SQL clauses, caller values, and execution ordering. The Serene variant changes fixed SQL construction to `sql` plus `bind`, then passes `bound.text` and `bound.params` to `db.query`.

Birch: `listInvoices` retains its finite sort selection, optional status branch, and dynamic raw query path in both variants; `findInvoice` retains the same concatenated ID SQL and missing tenant predicate; `invoiceSummary` is fixed and bound only in Serene.

Cedar: update and read paths retain the same state mapping (including the intentional `active` to `enabled` business error), tenant predicates, timestamps, and history/count values. Every Serene query is fixed and bound.

Maple: archived and unfiltered branches retain the same reviewed order choices, tenant values, and execution flow. Serene uses `orderBy` with static `sort` terms; no runtime SQL text is interpolated. Project reads all retain tenant predicates.

Line references in each gold file were checked against the current sources. No unresolved ambiguity remains in business or driver assumptions. This verification does not claim native driver integration or representative review coverage.

## Freeze validation corrections

The first mock run failed because the Serene Birch summary still omitted tenant scope; that fixed query and binding now match raw. The next run exposed Maple raw `orderKey` use before declaration; declaration order now matches Serene. The following runs exposed Serene `orderBy` newline/indentation differences from raw; raw formatting was aligned without changing SQL semantics. The final capturing mock run passed all 14 cases (Birch 4, Cedar 5, Maple 5), including hostile sort keys and an invoice ID containing SQL syntax. The mock captures calls only; it is not a database or native driver integration test.
