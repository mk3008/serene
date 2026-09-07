# Two-run behavior smoke test

Requested by PR #11 comment 5568755676. This follows the passed deterministic
production gate; it asks only whether the source filter visibly disrupts a small
construction-review workflow, not whether Serene improves general review or cost.

- Exactly two fresh Luna / medium participants, sequential: r01 Raw, then r02 filter.
- Same committed ticketing sources and TASK.md; only the opaque session argument
  changes in the prompt. Both receive the same explanation of possible markers.
- The evaluation-only host owns list/regex search/line-range reads. It calls the
  public production filter before stdout delivery in r02. It logs actual requests,
  response objects and exact stdout wire strings. No unfiltered fallback tool is
  offered to the participant. Native bypass remains possible outside the instruction
  contract and is not excluded by a claimed sandbox or complete platform trace.
- Original source is pinned by commit and SHA-256. Filter and harness/input hashes
  are frozen before either participant. Logs and final answers are preserved; no
  retries, replacements, extra participants or marker changes based on noise.
- A 30-operation ceiling bounds the small task. No artificial operation ordering
  or requirement to invoke Serene is imposed beyond using the mediated host.

Record search/read/list counts, errors, repeated identical search patterns,
repeated exact read ranges, progress after markers, observed bypass attempts and
final construction findings/dispositions. Report host operations, not total native
tool calls, tokens, time or money. Calls that fail remain in the record.

Judge explicit unproductive loops (e.g. three identical searches without new
evidence/progress), hitting the ceiling without completion, or sustained recovery
effort caused by inability to interpret markers. A few additional searches/reads,
one retry or a request for useful neighboring source is not a design failure.
Only clear marker-related repetition warrants considering a minimal improvement;
otherwise retain the shipped design. No automatic numeric cost/effectiveness score.

Expected source facts for interpretation, not supplied to participants: seven
ordinary execution functions; `searchTicketing` concatenates untrusted `phrase`;
`purgeTicketingPreview` uses fixed raw SQL; `sendTicketingSnapshot` uses an unmatched
sink with fixed SQL. Both latter paths must remain source-visible and may be
resolved by inspecting that source; they are not automatically vulnerabilities.

The host preflight checks actual subprocess stdout against the trace, the production
gate, metadata and preservation on both search and read. Keep evidence compact:
one shared host/protocol/freeze, two short request/response traces and final answers,
one result report. No full participant workspaces or new product adapters.
