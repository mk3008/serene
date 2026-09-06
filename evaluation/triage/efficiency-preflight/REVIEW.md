# Pre-freeze review package: no scored execution authorized yet

Prepared in response to [PR #4's review gate](https://github.com/mk3008/serene/pull/4#issuecomment-5559398742).
This is a concrete candidate for inspecting pairing, gold definitions, proposed
budgets and instrumentation. It is NOT an execution freeze or an effectiveness
result. Do not start scored participants until this material has been reviewed and
the remaining readiness conditions below have been met.

## Materials to inspect

| Material | Contents and review question |
| --- | --- |
| [Paired fixtures](fixtures/) | Harbor and Meadow: 100 execution sites each, 20 modules × 5 functions, Raw and Serene variants. Does ordinary application of the transformation preserve presentation and behavior? |
| [Harbor gold](harbor-gold.json) / [Meadow gold](meadow-gold.json) | Harbor D=1, proposed N=5; Meadow D=0, proposed N=5. Are finite dynamic paths appropriately classified as needing tracing rather than already resolved by brief screening? |
| [Conversion](convert.py) | Syntax-only conversion reads Raw code, never gold. It converts every fixed literal and leaves every interpolated construction as-is. |
| [Native pairing evidence](pairing-results.json) | 800 paired Node SQLite cases; equal SQL/values/rows or errors. A supplied SQL expression remains executable syntax only at D in both variants. |
| [Budget proposal](budget.json) | B=10 unique declared deep sites, 600 seconds, 256 KiB returned payload, 120 requests; checkpoints 1/3/5/10. Not calibrated participant limits yet. |
| [Logger](logger.py) / [tests](test_logger.py) | Persistent controller-owned JSON-line reader, search, deep-start, finding, audit and finish events; byte/time/request/site limits and no evidence overwrite. |
| [Delivery preflight](delivery-results.json) | Complete audit+search+one-module read fits both arms' byte cap. Controller output only: not evidence an agent received it. |

## Pair integrity and author knowledge

These are transparent synthetic measurement/calibration fixtures authored by the
current investigator, who knows the gold. They are not independently authored
held-out application tasks and must not be represented as such. Their repetitive
scaffolding may create shortcuts and ceilings; this is a material limitation for
any eventual product inference.

Each pair has identical filenames, function names, ordering, scaffold variables,
business SQL, values, and layout. Each function uses the same statement/params/
driver-call scaffold. All S modules receive the same import line. The only varying
local logic implements the underlying fixed, finite or runtime construction.
No comments, danger-bearing names or per-hazard import decoration are added.
Site positions are shuffled with fixed seeds disclosed only to the evaluator.

All 40 module pairs exactly match convert.py applied to Raw source. Eligible means
literal template without interpolation; this rule is applied uniformly without
consulting D/N. Runtime and finite interpolations stay visible as raw paths. This
may naturally make a remaining bypass stand out; that is an adoption consequence,
not an extra author annotation. Runtime bypasses are never converted to fake safe
constructors or repaired. S adds imports, sql tags, bind calls and matching driver
arguments; added lines are unavoidable and recorded by source diffs.

The current generator and conversion rules cover these fixtures only; they are
not proposed as a general production migration tool. No claim is made that leaving
every finite interpolation raw is the best production use of Serene. The conversion
policy itself must be reviewed before selecting a scored treatment.

## Measurement contract and limits

Only calls routed through the persistent Session are logged/enforced. A controller
owns its process and evidence log, outside the participant packet; it must not
restart the session to reset counters. Every read/search/audit payload is counted
before deep investigation. JSON envelope/counter and error-message bytes are not
part of the payload-byte metric. Rejected oversized content is withheld and the
rejection is recorded. Log timestamps are elapsed controller time, including agent
pauses, not pure inference latency. No token/currency measurement is claimed.

A `begin` names an existing source function and counts one unique declared deep
site; repeated work keeps consuming requests/time/bytes. Reaching B rejects new
site starts but permits finishing work on existing sites and submitting findings
within the remaining caps. Finding events record cumulative counters and time,
without consulting gold or telling the participant whether a finding is right.
Independent later adjudication locates the first correct dangerous finding.

Deep starts are declarations, not proof of cognitive effort. Read/search logs can
corroborate them, but opening five functions in one file does not prove five deep
investigations. Both arms can screen/search and choose their own order; no forced
grep inventory or forced full review. The current prototype supplies literal search
and range reads, not an unrestricted shell or complete IDE. Available normal tools
and capture of their costs require validation before a claim about normal workflows.

In Work's shared filesystem, a participant could bypass this interface or tamper
with accessible state. The prototype does not detect every such access and is not
a physical sandbox. An authorized instruction-scoped pilot could use it with those
limits disclosed, but must not claim complete access enforcement or cost certainty.
Measured costs require trustworthy mediation; self-reported adherence cannot prove
absence of unlogged work. Invalid/missing trace outcomes are retained, not replaced.

## Validation performed and remaining readiness

Completed without any model reviewer invocation:
- 800 paired native SQLite cases with exact SQL/value/result/error correspondence.
- All 40 S modules reproduced by the gold-blind converter.
- Eight logger tests: initial read/search accounting, unique-site cap/repeated work,
  finding snapshots, time cap, byte withholding, request/finish behavior, path/symlink
  confinement through the interface, no log overwrite, and no audit in R.
- Four deterministic delivery checks; audit+search+one read consumed 73,051 payload
  bytes in each S packet, versus 11,050 in each R packet. This is tool output volume
  for these scripted actions, not reviewer efficiency or evidence against Serene.

Before a scored execution freeze:
1. Review these pairing/gold/budget/logger choices as requested. In particular,
   review author cues, provisional N labels and treatment conversion policy.
2. Use an unrelated agent-visible calibration to validate transport, logging,
   feasible numeric caps and stopping. None has been performed for this logger.
3. Independently validate the selected scored task set and D/N criteria; distinguish
   calibration replicas from representative held-out application packets.
4. Freeze practical effect/coverage tolerances, exact prompt/tool surface, task count,
   models/order and reviewed numeric limits with hashes. Those are not implied by
   this candidate. Do not invent calibrated thresholds from the deterministic results.

These are preparation conditions, not a request to silently launch calibration or
scored runs. The user's explicit review gate remains in force. Keep PR #4 Draft.

## Reproduce local preparation checks

From the repository root with its existing installed dependencies/build:

```sh
python evaluation/triage/efficiency-preflight/prepare.py
node evaluation/triage/efficiency-preflight/verify.mjs
python -m unittest discover -s evaluation/triage/efficiency-preflight -p 'test_*.py'
python evaluation/triage/efficiency-preflight/check_delivery.py
```

`prepare.py` regenerates candidate fixture bytes, not historical study evidence.
Use only before an execution freeze; never overwrite scored packets/results.
