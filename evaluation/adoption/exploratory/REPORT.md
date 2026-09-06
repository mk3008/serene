# Exploratory adoption results

Nine fresh coding sessions completed three independently authored SQLite tasks under
D (short Serene instruction), E (D plus ordinary audit), and F (D plus strict audit).
All nine passed the public and hidden functional tests and used Serene correctly.
Strict audit blocked two correct dedicated-source implementations in F because its
file-local analysis could not resolve imported SQL provenance.

| Outcome | D | E | F |
| --- | ---: | ---: | ---: |
| Functional success | 3/3 | 3/3 | 3/3 |
| Correct Serene execution sites | 4/4 | 4/4 | 4/4 |
| Assigned check passes | 3/3 | 3/3 | 1/3 |
| Unnecessary bypass or harmful layout change | 0/3 | 0/3 | 0/3 |
| Human clarification requested | 0/3 | 0/3 | 0/3 |

The colocated task passed strict audit in all arms. The two dedicated-source tasks
remained review-required in all arms when independently audited after submission.
Their nine execution sites have correct imported fixed SQL and matching named
bindings. The other three sites are ordinary. Audit also reports construction/bind
boundaries; these are not additional execution sites or independent observations.

The evaluator reran 9 public and 27 hidden tests against native SQLite: all 36
passed. Protected instructions, check scripts, schemas, tests and dependencies were
unchanged in every packet. All preregistered source hashes still match. No scored
run was retried. E participants reported the unresolved findings despite exit 0;
F participants preserved the required layout and disclosed exit 1. There was no
observed gate appeasement. Each arm changed six source files across its three tasks.

## Evidence and assessment

The [protocol](PROTOCOL.md), [freeze](freeze.json), and [source hashes](source-hashes.json)
were committed before dispatch at remote commit
`0e3720e43674b0225fd9c9fef31fab67f32c4a69` (tree
`4e93ea6c29d3bfc2820196f4c70bc3392a06cd77`).
[Per-run artifacts](results/) preserve submitted source, unedited participant final
responses, self-reported command logs, complete check output, evaluator TAP output
and both audit modes. [Aggregate counts](aggregate.json) and [timing](timing.json)
are separate from interpretation.

An independent fresh adjudicator received shuffled initial/final source and task
contracts without treatment labels, check scripts or participant conclusions.
[Adjudication](adjudication.json) verified all twelve named bindings and found no
confirmed source defects or layout violations. The same frozen public
[API/runtime](adjudication-api/) was supplied after its initial assessment to resolve
return-shape questions; this clarification and the original uncertainty are recorded.
[Mapping](adjudication-mapping.json) is evaluator-only. This was label-hidden
assessment, not complete blinding: source layout remained visible.

## Limits

This is the separately scoped, user-authorized instruction-isolated Work pilot,
not the planned 96-run adoption or 24-run layout study. Fresh sessions did not
inherit author conversation, but shared filesystem access remained technically
possible. Access logs are participant reports, not a complete platform transcript.
The nine runs inherited the available model/reasoning configuration; exact served
model, effort and tokens are unavailable. Timing is dispatch-to-observed-completion,
not isolated model latency, and supports no cost comparison.

All arms had the same short instruction, installed package/docs and experimental
wrapper. There was no no-instruction, README-only, shorter-instruction or Rules-only
arm. Thus this supports feasibility on these three tasks, not a minimum instruction
claim, an instruction-length effect, or general agent adoption rates. The complete
coding-success ceiling prevents estimating an audit adoption benefit. Source sites
are clustered within tasks and must not be treated as independent trials. Native
SQLite evidence does not establish other-driver compatibility.

## Decision

Use ordinary audit as inventory for the measured dedicated-source setup. Do not
recommend strict audit as a universal adoption gate: correct imported provenance
still requires separate review. Keep Raw SQL Rules and the runtime API unchanged;
this is not a controlled comparison supporting a Default 1 policy change.

Proceed to a separately frozen, small code-review pilot with independently authored
paired tasks, preserving D versus C (audit versus grep) and outside-construction
bugs. That study must measure review outcomes directly. Following the user's cost
preference, request Luna with medium effort throughout that new cohort; Terra with
medium effort is a candidate for a separately recorded later cohort, not an
unreported mid-study replacement. Keep PR #4 Draft.
