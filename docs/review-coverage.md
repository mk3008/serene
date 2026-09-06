# What Serene can and cannot find

Discovery, referral and correct defect diagnosis are separate. Only the first two
were measured by the historical pre-redesign deterministic evaluation. AI review effectiveness is
not measured.

| Source pattern | Inventory behavior | Remaining review |
| --- | --- | --- |
| Literal Serene SQL, bind, direct candidate driver call | Ordinary construction | SQL meaning, authorization, matching values, actual driver use |
| Visible concatenation/interpolation at a known sink | Violation | Determine exploitability; policy violation is not proof of a vulnerability |
| Unknown argument at a known sink | Review required | Trace its origin |
| Local const alias/destructuring/Function.bind of a named sink | Violation or review required, never ordinary | Receiver, prebound arguments, actual target |
| Computed invocation | Review required | Whether it executes SQL and which function is called |
| Custom wrapper with configured sink name | Candidate, argument classified conservatively | Wrapper behavior and argument contract |
| Imported or mutable renamed execution function without matching name | Can remain unseen | Manual execution-API inventory/configuration |
| SQL in files not supplied, dynamic code, arbitrary call/apply/Reflect | Not comprehensively covered | Manual coverage review |
| Non-SQL query/execute methods | Possible false candidates | Dismiss after verifying target |
| Wrong values, missing tenant filter, SQL execution within DB | Can remain ordinary construction | Full application/security review |

## Evidence, not a blanket safety claim

At checkpoint `b93e3d4a92df353cfdbec6154c0144739f6eb2e6`, the frozen challenge set has 33 SQL execution sites and 7 non-SQL controls. Local
alias discovery increased detected SQL sites from 25 to 30 and referrals among 19
construction concerns from 11 to 16. Three SQL sites remain unseen. Non-SQL false
candidates increased from 3 to 4. Nine sites remain ordinary construction, including
three with defects outside that guarantee. Never drop ordinary sites from general
code review.

The same author designed the corpus and fix. These are reproducible mechanism tests,
not a representative sample, blinded holdout, successful AI review or a statistical
significance result. Simple grep comparators are included, but humans/AI can follow
grep leads beyond matched lines; the experiment does not measure that behavior.

Sources, oracle, initial/final raw JSON, exact hashes, case-by-case matrix and follow-
up AI protocol are in the repository's [evaluation directory](../evaluation/triage/REPORT.md).
No public AI effectiveness claim is justified yet.

The API redesign keeps alias regressions in the current unit suite, but does not
relabel or rerun the frozen corpus against a different API. Those aggregate numbers
are historical and are not a measurement of the new `sql` API.
