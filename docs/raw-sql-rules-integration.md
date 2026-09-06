# Using Serene with Raw SQL Rules

Raw SQL Rules owns the policy; Serene implements part of its construction boundary
for TypeScript/JavaScript. Neither requires a runtime dependency on the other.
This mapping was checked against Raw SQL Rules v0.2, blob
`6b2a6f659e2d106a12f4f0c9da2c7444f178adf4`:
[authoritative Rules](https://github.com/mk3008/raw-sql-rules/blob/main/raw-sql-rules.md).
Pin the selected Rules revision in the application; do not copy it into Serene.

| Responsibility | Serene contribution | Application responsibility |
| --- | --- | --- |
| Reviewable ordinary SQL | Literal SQL remains visible | Select and review authoritative SQL sources |
| Application-owned integration | Keeps native driver external | Connections, transactions, mapping, retries, deployment |
| No arbitrary runtime syntax | Fixed tags, separate values, finite sort choices | Review bypasses and database-side dynamic SQL |
| Dedicated SQL source per statement | A dedicated TS/JS file can contain the literal | Choose layout; Serene does not enforce one statement per file |
| Meaningful parameter names | Native named SQL or explicit positional lowering | Choose meaningful names and correct business values |
| Current inspectable schema | None | Provide current schema |
| Real DB/driver verification path | None | Provide and run integration checks |

## Minimal repository instruction candidate

Install Serene and make its README available. For Rules users, install/pin Rules
through their own supported workflow and retain the generated local instruction
reference. Add this Serene-specific instruction to the application's AGENTS.md:

```md
For executable application Raw SQL in TS/JS, use @mk3008/serene as the default
construction path; native string acceptance alone is not a reason to bypass it.
If this would materially impair SQL functionality, preserve the SQL and report an
additional-review exception; do not expand Serene or disguise the bypass.
```

This is a candidate to test, not an empirically established minimum. The application
must also supply normal build/test instructions and the selected driver's contract.
Rules' dedicated-source requirement is compatible with exported Serene SQL, but
current file-local audit cannot establish imported provenance. Scanning both files
does not change that. Keep unresolved paths review-required; do not co-locate all
SQL merely to make strict mode pass or claim Rules is fully enforced by Serene.

## Inventory and gates

Add `serene-audit src` to an application check script, adapting source roots and
`--sink=name` to the actual execution APIs. It fails on violations and reports
review-required paths. Review those reports through the normal review process.

`--strict` also fails on every review-required finding, including legitimate
exceptions, cross-file SQL and false candidates. Use it only when that blocking
policy fits the application. There is no reviewed-exception manifest yet. Neither
mode proves complete sink coverage, correct bindings or safe business semantics.

Do not add a manifest or cross-file analysis merely to make an adoption experiment
succeed. First measure whether these limitations are a practical adoption blocker.


## Evaluating Default 1 rather than assuming it must stay fixed

The dedicated-file requirement is a policy choice whose benefits and costs can be
measured. A separate candidate is one directly reviewable authoritative definition
per executable statement, permitting SQL beside its caller/access operation. It
must retain ordinary visible SQL, unique discovery, meaningful definition/binding
names, current schema and real DB/driver verification. It must not introduce copied,
generated or opaque authoritative SQL.

This candidate is not compliance with the unmodified dedicated-file Default 1.
It is an explicit experimental customization of that default. Keep the Scope/Safety Contract
and Defaults 2-4 fixed to the selected v0.3 revision. The v0.2 mapping above is not a
claim about every v0.3 revision. The subsequently inspected draft is pinned in
[Rules reference](../evaluation/adoption/RULES-REFERENCE.json): v0.3 uses Scope +
Safety Contract and explicitly requires named definition and named caller binding
in Default 2. Include that exact revision in the eventual execution freeze.

The [layout study](../evaluation/adoption/LAYOUT-STUDY.md) compares discovery,
binding/execution follow-through, functional/live DB checks, harmful rewrites and
file/review effort, including a representative multi-statement operation. Dedicated
files may improve discovery; co-location may improve transaction and execution
locality. Neither advantage is assumed.

If evidence supports preserved reviewability and discoverability without weakening
Contracts or Defaults 2-4, a separate evidence-backed Raw SQL Rules v0.3 PR proposing
an authoritative-definition default becomes an option. If dedicated files clearly
win, retain that default and then consider Serene cross-file provenance or reviewed
exceptions. Inconclusive evidence means no policy change. This PR changes neither
Raw SQL Rules nor Serene's runtime/audit capabilities, and supplies no controlled
layout-effect results. The later [coding pilot](../evaluation/adoption/exploratory/REPORT.md)
provides limited adoption feasibility and import-only gate-friction evidence.
These are integration outcomes, not SQL-safety triage effectiveness. Keep the
[research questions](../evaluation/README.md) and their scores separate.


The [SQLite preflight](../evaluation/adoption/preflight/REPORT.md) now reproduces
matching behavior and the imported-provenance gate difference on four author-created
scenario pairs. This is limited mechanism evidence, not an adoption or discoverability
study. It does not yet justify changing Default 1.
