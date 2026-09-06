# Serene review triage: evidence and limits

**Result: a reproducible discovery improvement, not evidence of improved AI defect
recall.** This PR closes five local execution-alias blind spots in the frozen
challenge set and separately fixes a potential ordinary-provenance misclassification.
It does not establish statistical significance, real-world recall, or review time saved.

## Frozen inputs and reproduction

Baseline product: `6ebce0d064dbee21caf53ce1f1f3441259cfffa2`.
Plan checkpoint: `d218690f15ad331bb0ce8c874b0a48e1e2322435`.
Corpus + initial results checkpoint: `29099e923d5cd726da49946fc0b981795ad15683`.

The same author created the product, challenge cases, oracle and fix. The corpus
was committed before the fix, but is **not an independent holdout**. It deliberately
includes known weaknesses. Source is synthetic, not production prevalence. Oracle
labels include stated assumptions about external wrappers and business requirements;
these are not live exploit demonstrations. All raw findings and source hashes are
retained, including negative controls and misses.

```sh
npm ci
npm run build
node evaluation/triage/run.mjs /tmp/serene-triage-results.json
node evaluation/triage/check-alias-regression.mjs
npm run check
```

Run from the repository root with baseline history available. The runner loads the
exact initial audit from Git, uses the unchanged runtime, and rejects runtime source
changes. It removes its temporary module after importing. The corpus is shared by
all strategies. Compare hashes/counts with final-results.json; no random seed or
model answer is involved. The standalone regression script reproduces the separate
post-corpus finding. Artifacts were generated with Node 24.19.0 / TypeScript 5.9.3.

## Results

40 cases: 33 SQL execution sites (19 construction concerns) and 7 non-SQL controls.
Each fixture has exactly one marked call site. A finding must occur there to count;
Serene tag/bind findings elsewhere are not credited as discovery of the sink.

| Measure | Grep call names | Grep SQL keywords | Initial Serene | Improved Serene |
| --- | ---: | ---: | ---: | ---: |
| SQL execution sites discovered / 33 | 22 | 9 | 25 | 30 |
| SQL execution sites unseen / 33 | 11 | 24 | 8 | 3 |
| Construction concerns referred / 19 | 8 | 6 | 11 | 16 |
| Construction concerns incorrectly ordinary / 19 | 0 | 0 | 0 | 0 |
| Construction concerns unseen / 19 | 11 | 13 | 8 | 3 |
| SQL sites labeled ordinary construction | 0 | 0 | 9 | 9 |
| Non-SQL candidate false positives / 7 | 4 | 2 | 3 | 4 |
| Files with any finding / 40 | 26 | 27 | 28 | 34 |

The grep comparators are precisely defined line regexes, recorded in results JSON;
they are not every possible use of grep. They model matching locations, **not a human
or AI following matches through source**. SQL keyword search found leads in 27 files,
even though only 9 sink lines matched: reporting only sink matches would undervalue
its usefulness. Adding custom patterns or manual tracing can improve grep discovery.
C03 has explicit custom-sink configuration; the default grep has no corresponding
custom name. The most interpretable improvement is initial versus improved Serene
on identical inputs, not a universal Serene-versus-grep claim.

Five previously unseen local aliases (A01–A05) now become violation or additional-
review findings. One extra non-SQL alias is also referred (N06), an explicit precision
cost. No runtime code, public API or runtime dependency was added. Alias candidates never receive
ordinary status because receivers and prebound arguments are not proven.

Nine sites retain ordinary construction. Three of those (L01–L03) intentionally have
other defects: mismatched values, missing tenant filtering, or database-side dynamic
execution. **Do not remove those nine sites from general code review.** The benefit
is potentially less work establishing construction provenance, not nine safe queries
or a measured time saving. R04 also shows that a policy violation can be safe finite
raw concatenation, not an actual injection vulnerability.

## Additional regression found during implementation

An alias named `query` itself previously took the direct-name fast path:
`const query = db.query.bind(db, runtimeSql); query(screened.text)` was labeled ordinary
based on the invocation argument rather than the prebound SQL. The updated audit
prioritizes alias provenance and emits `SINK_ALIAS` / review-required. Mutable aliases
with known sink names are also never promoted to ordinary.

This case was discovered **after** the corpus freeze; it is excluded from the 40-case
counts. See alias-regression.json and check-alias-regression.mjs. It demonstrates an
incorrect source classification, not a successful live-driver attack; actual argument
acceptance depends on the driver. Regression tests include shadowing, cycles, defaults,
mutable aliases, bound arguments and non-SQL method names.

## What remains invisible or uncertain

See [the full matrix](COVERAGE.md) for every case and its oracle.

- Imported wrappers without configured names (A06), mutable renamed execution
  functions (A07), and unconfigured custom APIs (C02) remain unseen.
- Unknown SQL arguments, computed calls, imported SQL and namespace imports may be
  found but require review; discovery is not successful vulnerability diagnosis.
- Naming heuristics still mistake non-SQL APIs for candidates. They do not prove
  driver identity. Alias candidacy may be stale after receiver-property mutation;
  keeping those candidates nonordinary is intentional.
- Missing files, dynamic code, call/apply/Reflect invocation and arbitrary forwarding
  are not comprehensively inventoried. There is no application-wide coverage claim.
- Syntax, business correctness, authorization, actual text/value pairing and second-
  order SQL execution remain outside ordinary-construction guarantees.

## AI evidence and next decision

AI review runs: **not run**. The environment has no Codex executable or standalone
model evaluation endpoint; the source author cannot serve as an independent blinded
reviewer. No paid service or credential workaround was attempted. Static referrals
are not AI discoveries. There is no AI effect size, confidence interval or p-value.

[AI-STUDY.md](AI-STUDY.md) specifies a follow-up pilot and the conditions for a later
confirmatory study. Its primary comparison uses the *same Serene source* with grep
versus Serene inventory, preserving every defect. Representation changes are assessed
separately. It is a protocol, not an implemented model runner or completed study.

Current justified claim: Serene provides a machine-readable construction-review
classification, and a bounded change improved call-site discovery on this challenge
set. Whether that classification makes AI reviewers materially better remains open.
Keep the small alias fix; do not add whole-program analysis on this evidence alone.

## Validation

Regression tests first reproduced 3 failures before the alias fix. Full suite after
the change: 67 tests passed, 0 failed/skipped; strict type checks and tooling syntax
checks passed. Packed tooling import/CLI smoke verification is recorded in the PR.
No npm publication, DB execution, independent holdout or AI review run occurred.
