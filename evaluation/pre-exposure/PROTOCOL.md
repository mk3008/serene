# Pre-exposure connection experiment

Question: can a caller-owned search/read primitive be connected to Serene before
its source response reaches the reviewer, retaining unresolved source while
reducing total delivered review output?

This is approach 1: a response-boundary filter, applied to both rg JSON match rows
and source reads. The controller chooses neither search patterns nor candidate
inventory. It runs the real audit on the exact source snapshot and replaces only
positively ordinary, construction-only function ranges with compact markers.
Unknown/mixed functions remain source. Requested call rows are represented by
exact candidate coordinates; a search matching only another row does not receive
an invented execution site. Input/output correspondence is retained internally.
There is no subsequent candidate handoff tool.

The mask recognizer deliberately accepts a small subset: top-level functions made
only of ordinary Serene construction and ordinary driver-candidate calls. It
rejects defaults, bindings, assignments, nested executable functions, arbitrary
calls, computed access and effectful arguments. Invalid syntax or a stale snapshot
cannot acquire a mask. Same-line adjacent source keeps original column offsets.
These checks are response-elision safety checks, not new Serene provenance APIs.
Driver identity remains the audit's syntactic sink heuristic; ordinary is only
construction provenance. Other review scopes must not use this masked view.

Sequence fixed before the fresh probe:

1. Deterministic filter and actual controller tests, independent adversarial review.
2. One fresh Luna/medium probe, Serene ticketing task only. Require no ordinary body
   exposure, exact independently scored discovery, retained actionable/unmatched
   paths, and correct danger diagnosis. Repair a demonstrated interface failure
   before freeze, preserving failed evidence. No Raw comparison at this step.
3. Freeze code, task sources, instructions, scoring, and gold after a passing probe.
4. Four fresh Luna/medium reviews: ticketing Raw/Serene, stockroom Raw/Serene.
   One run per cell, no retries or coaching. Report all errors and outcomes.

Both arms choose search/read scope and receive the same numbered-row response
format and public driver/input contracts. Both submit exact candidate coordinates,
findings as soon as supported, and final dispositions. Serene additionally receives
positive ordinary markers instead of bodies. There is no supplied site list.

Tasks and gold are reused unchanged from the prior end-to-end cohort. Fresh agents
have no earlier cohort or evaluator context. This controls source pair differences
and isolates this connection in a small descriptive comparison; it is not a new
held-out benchmark. Existing fixture parity evidence applies to the unchanged
source pairs. Neither the probe nor the earlier cohort enters the four-run totals.

Primary costs: sum of every recorder response's actual UTF-8 JSON wire bytes,
including info, errors, discovery/finding acknowledgements and finish; delivered
source text bytes; read/search/all request counts. Also report request JSON bytes,
fixed prompt bytes and internal filter I/O separately. Internal primitive source
and audit evidence never enter the participant response. This is not measured
model tokens, billing, hidden reasoning, or native tool-envelope overhead.

Correctness: exact file/line/column discovery against separate frozen gold;
positive marker + skip disposition + zero body exposure for actual ordinary skip;
actionable/unmatched retention; independent mechanism adjudication of findings and
false findings. Row correspondence loss is separate from final execution discovery
loss: rg matches are source rows, not an execution inventory. Ordinary count is
never a coverage denominator. No location correction or post hoc candidate repair.

The controller is an instruction-mediated interface in this environment, not an
OS sandbox. Every registered operation is logged, but native session transcript
export is unavailable. Production use requires intercepting every source-bearing
search/read response used for this review, not merely adding a later CLI command.
The agent's search capability and source snapshot are retained; whole-program
provenance, semantic search adapters and application driver identity are not added.

Keep the PR Draft. Keep the chosen prototype in evaluation only; remove unused
trial code. If this approach fails the behavior gate, record why and try another
materially distinct connection, up to the five authorized approaches. Passing one
approach does not require manufacturing four more attempts.
