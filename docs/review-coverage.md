# What Serene can and cannot find

Discovery, referral, correct defect diagnosis, and review cost are separate. The historical pre-redesign deterministic evaluation measured discovery/referral mechanics only. Later AI studies evaluate bounded review workflows and their costs; they do not turn the audit into a blanket whole-program or universal-efficiency guarantee. See the [evaluation map](../evaluation/README.md).

| Source pattern | Inventory behavior | Remaining review |
| --- | --- | --- |
| Literal Serene SQL, bind, direct candidate driver call | Ordinary construction | SQL meaning, authorization, matching values, actual driver use |
| Visible concatenation/interpolation at a known sink | Violation | Determine exploitability; policy violation is not proof of a vulnerability |
| Unknown argument at a known sink | Review required | Trace its origin |
| SQL imported from another source file | May remain review required even when both files are selected | Follow definition/export/import through binding and execution; see [layout and provenance](sql-layout.md) |
| Local const alias/destructuring/Function.bind of a named sink | Violation or review required, never ordinary | Receiver, prebound arguments, actual target |
| Computed invocation | Review required | Whether it executes SQL and which function is called |
| Custom wrapper with configured sink name | Candidate, argument classified conservatively | Wrapper behavior and argument contract |
| Imported or mutable renamed execution function without matching name | Can remain unseen | Manual execution-API inventory/configuration |
| SQL in files not supplied, dynamic code, arbitrary call/apply/Reflect | Not comprehensively covered | Manual coverage review |
| Non-SQL query/execute methods | Possible false candidates | Dismiss after verifying target |
| Wrong values, missing tenant filter, SQL execution within DB | Can remain ordinary construction | Full application/security review |

## Bounded native QueryConfig recognition

For a direct candidate named `query` with exactly one argument, the audit also
recognizes a proven Serene `BoundSql`, such as `client.query(q)` or
``client.query(bind(sql`SELECT :id`, { id }, 'indexed'))``. Existing file-local
`const` aliases of the binding retain its provenance.

An inline `{ text: q.text, values: q.values }` is ordinary only when it has exactly
those two identifier-named data properties, each accessing a recognized BoundSql.
Property order and parentheses do not matter. This is construction provenance,
not validation of the driver's QueryConfig contract. Both fields can originate
from different bindings; matching values, mutable array contents, serializers,
SQL meaning and driver identity still require separate review.

Configuration-object aliases (including `const`), mutable bindings, getters,
computed or quoted keys, shorthand, spreads, duplicate/extra properties, casts,
unknown fields, wrappers and factories remain review-required. The new recognition
does not apply to local sink aliases, other sink names or extra call arguments.
Existing direct `.text` recognition and visible string-construction violations
are unchanged; unsupported objects are unresolved rather than recursively inspected.

The source and diff filters deliberately retain their stricter driver-argument
syntax: QueryConfig calls remain source-visible even when the audit marks them
ordinary. Changes between a suppressible `.text` call and a QueryConfig call stay
visible, with lost/gained construction-function navigation. No ORM adapter or
arbitrary object-flow analysis is involved.

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

Later PR #4 studies add conditional AI-review evidence: covered-site triage reduced additional construction-review response cost on small supplied site sets; a later handoff added cost after source had already been read; and pre-exposure filtering could prevent ordinary-body delivery while retaining actionable paths and correct diagnosis in a mediated workflow. Those results have different connection points and must not be pooled into one product score. They do not establish universal token, billing, latency, or automatic-agent adoption benefits. See the [evaluation map](../evaluation/README.md) for the evidence boundaries.

The API redesign keeps alias regressions in the current unit suite, but does not
relabel or rerun the frozen corpus against a different API. Those aggregate numbers
are historical and are not a measurement of the new `sql` API.

Every finding carries `function` as supplemental lexical location metadata. It is a
name only when the nearest enclosing function syntax supplies one confidently;
anonymous callbacks and unsupported function-like syntax are `null` and never
inherit a named outer function. This label does not affect classification.

## Selecting source files

`serene-audit src`, `serene-audit .`, and mixed file/directory inputs recursively
inventory `.ts`, `.tsx`, `.mts`, `.cts`, `.js`, `.jsx`, `.mjs`, and `.cjs` files.
Explicit regular files are accepted regardless of extension. Duplicate resolved
paths are analyzed once; output files are sorted by absolute path. Declaration
files are included. No glob expansion, extension option, or ignore-file parsing is
provided by the CLI.

Recursive discovery skips directories named `node_modules`, `dist`, `build`,
`coverage`, or `.git`, and does not follow symbolic links. JSON `skipped` entries
identify these omissions. An explicitly supplied directory is traversed even if
its own name is normally excluded; explicitly supplied symbolic links fail.
Select the real source path if it is needed. Unreadable/missing inputs and an empty
selection exit 2 without a partial JSON success report. A selected source with no
candidate findings can still exit 0; always inspect the `files` coverage list.

Exit 1 means a violation, or any review-required finding with `--strict`. Exit 0
is not approval of every SQL path. Recursive selection does not add cross-file
provenance or exhaustive sink discovery. For example, an imported SQL definition
can remain review-required even when both files are selected.

`--actionable-only` retains the selected `files` and `skipped` coverage records, but
reports `executionSiteCounts` from `driver-candidate` findings only. This prevents a
single execution path from being counted again for its `serene` construction or
binding boundaries. Its `findings` list omits ordinary rows and retains every
review-required or violation row, including source parse errors and computed calls.
The counts are therefore an inventory of recognized candidate execution sites, not a
count of all SQL execution in the application.

Use `serene-audit --strict src` as a gate only where all review-required paths are
intended to block. Legitimate native SQL exceptions and unresolved provenance still
need application review; do not rewrite useful SQL just to make strict mode pass.
Use the normal inventory plus the application's exception review process where
such paths are intentional. There is no exception-approval manifest in this CLI.
