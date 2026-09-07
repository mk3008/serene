# p06 independent artifact judgment

**Required review outcome: PASS.** `REVIEW.md` identifies
`findCustomersForExport` and supports the required follow-up with concrete runtime
`state` concatenation at `db.query`. It correctly treats `customerById` as the
recognized fixed path. The review retains `listInactiveCustomers` as a
review-required provenance follow-up while also stating specific source evidence
that its statement is fixed and currently returns inactive rows.

**Referral/gate distinction.** The `listInactiveCustomers` recommendation is a
provenance follow-up—to migrate it to recognized construction or document an
exception—not a claim that its fixed statement is a vulnerability and not a
separate deployment-blocking gate. The only explicit deployment block concerns the
actual dynamic export construction. No source rewrite or functional failure occurs:
`app.mjs` and `database.mjs` are unchanged in the harvested packet. The public
native test passed, but it is separate from review correctness.

This judgment is based on the harvested artifact and frozen gold only. It makes no
inference about policy reading, whether CLI output was received, file access, or why
the review was written.

## Evidence

- `REVIEW.md`: required dynamic-construction finding; source-supported fixed-SQL
  referral; no change to application behavior.
- `postrun-integrity.json`: three CLI entry records (a process observation only).
- `public-test.*`: exit 0; native test passed (separate from review correctness).
