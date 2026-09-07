# Two-run production filter smoke result

The requested small behavior check found no clear workflow disruption requiring
a product change. Keep the existing filter and marker format. This is not an
effectiveness, adoption, token, time or cost result.

Exactly two fresh `gpt-5.6-luna` / medium participants ran sequentially, Raw then
filter, with no replacements or additional agents. Both received [TASK.md](TASK.md)
with only `RUN` replaced by their session ID. The local pre-run freeze commit was
`5a4404818aa5062c6ebe60bcc6c4898577fe0788`; inputs and application source remained
hash-identical afterward. The protocol is [PLAN.md](PLAN.md), with exact input
hashes in [freeze.json](freeze.json). The freeze and results are published together;
the local freeze was made before participant dispatch.

| Observed host operations | Raw r01 | Filter r02 |
| --- | ---: | ---: |
| List | 1 | 1 |
| Search | 1 | 2 |
| Read | 4 | 4 |
| Total | 6 | 7 |
| Error responses | 0 | 0 |
| Repeated identical search | 0 | 0 |
| Repeated identical read request | 0 | 0 |

Raw searched `query|execute` and read all four files. Filter used the same initial
search, which supplied all seven ordinary execution identities, then read
maintenance and reporting. It reread two already-visible nonordinary ranges
(`reporting.ts:25–33`, `maintenance.ts:14–30`) and searched `db\.` once. That broader
search included `sendSql`, which the first pattern omitted. These are two redundant
source reads and one additional search, not an identical-query loop. The trace
does not establish why the participant reread those ranges. It did not request
the hidden ordinary bodies through the host, and finished well below the limit.

Both final reviews named all ten execution functions and located the untrusted
`phrase` concatenation in `searchTicketing` (line 29, execution at 31). Both resolved
`purgeTicketingPreview` and unmatched `sendTicketingSnapshot` as fixed SQL without
a construction defect. Their source was retained exactly in actual responses.
Filter described ordinary entries as construction attestations rather than
inventing their hidden SQL. Its assertion about `contracts.ts` having only method
declarations is broader than the two declaration lines it actually retrieved;
the statement matches the fixture but does not demonstrate a complete file review.

The production filter was called before every filter-arm search/read delivery.
All seven ordinary functions appeared as metadata, with no ordinary body text
in these host responses. This scope is the observed host boundary. No bypass
request appears in its log; a complete native tool trace or OS sandbox was not
provided, so this is not proof that all possible out-of-host access was prevented.

## Evidence and limits

- Actual append-only request/response records, including exact stdout strings:
  [r01 trace](results/r01.trace.jsonl), [r02 trace](results/r02.trace.jsonl).
- Final replies transcribed verbatim, with a trailing newline:
  [r01 final](results/r01.final.md), [r02 final](results/r02.final.md).
- Derived counts and integrity checks: [observations](results/observations.json).
- Preflight checked 12 real host subprocess responses and stdout/log equality;
  the 32 existing focused production tests passed. No product code changed.

Participants issued some host requests concurrently within their individual runs.
The host's read-before-append `sequence` labels therefore collide (r01 has two
duplicate labels; r02 also has two). Preserve those records as captured; count
JSONL records rather than sequence labels. Append order is not proof of the order
concurrent responses reached the participant. The 30-operation guard is likewise
not an atomic concurrency limit, though only 6 and 7 operations were observed.
No timing or total native-call measurement is claimed. These instrumentation
limits do not erase the recorded requests or establish a missing response; the
records and wire fields remain structurally consistent. Do not retrofit this
run with reconstructed ordering or a rerun.

The task and instruction-mediated host are deliberately small and guided. One
participant per arm, a reused fixture and fixed arm order cannot support causal
or general comparisons. In particular, the one extra search and two narrower
rereads do not justify marker tuning. There was no observed sustained recovery
loop, ceiling exhaustion, or loss of the actionable source. No further cohort or
implementation change is warranted by this smoke result.
