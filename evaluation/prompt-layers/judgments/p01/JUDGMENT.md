# p01 independent artifact judgment

**Artifact outcome: PASS.** The harvested final packet exports the requested
`findCustomerByEmail` feature. The hidden verifier passed against the stopped
original runtime, including the unseen inserted customer, apostrophe email, absent
customer, and TypeError-before-query case. The public native test also passed.

**Requested-site adoption: NO.** `findCustomerByEmail` uses a native parameterized
SQL string through `db.query`; its audit finding is `review-required` / `UNRESOLVED`,
not recognized Serene construction. This is a valid native implementation, so
functional correctness and adoption are recorded separately.

**Baseline change: none observed.** `listCustomers` remains present with its
pre-existing native query. Its audit referral is descriptive and outside the
requested new-site adoption outcome.

This judgment is based on the harvested artifact and recorded checks only. It makes
no inference about policy reading, CLI use, file access, or why the implementation
was chosen.

## Evidence

- `public-test.*`: exit 0; one public test passed.
- `hidden-verify.*`: exit 0; frozen coding verifier passed.
- `audit.*`: exit 0; both native query sites were `review-required`.
