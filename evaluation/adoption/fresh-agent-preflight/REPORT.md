# Fresh-agent preflight: output delivery passes; physical isolation fails

Status: NOT-YET for the existing study execution contract. Two fresh-agent
preflight invocations completed; zero scored adoption/layout/review invocations.
PR #4 remains Draft. No efficacy result or policy recommendation is inferred.

The user authorized fresh-agent preflight. Each participant was spawned with
`fork_turns: none`, with only its saved task prompt and inherited platform context.
No model/reasoning override was supplied. Prompt/packet hashes and pass criteria
were committed locally before invocation (8449eca), preserved remotely at
`8bfbfff1ca04f79551aa4056e691f38058bb51a7`. The actual spawn strings omit the text
files' final newline; `invocations.json` records those exact string hashes and the
normalization explicitly. There was one invocation per probe and no model retries.

## Evidence

| Gate | Observation | Result |
| --- | --- | --- |
| Success-output forwarding | Output participant returned the exact finding at input.ts:1:1 after exit 0 | PASS for this untruncated preflight |
| Failure-output forwarding | Same participant returned the exact finding after strict exit 1 | PASS for this untruncated preflight |
| Fresh conversation | Spawn used fork_turns none; participant reports no prior author conversation | Supported by configuration and participant observation, not independent platform attestation |
| Filesystem isolation | Separate participant read the authorized harmless canary outside the packet, exit 0 | FAIL: working directory is not an enforced sandbox |
| Exact model/reasoning metadata | Inherited configuration; participant could not verify exact values | Unresolved for formal freeze |
| Model token accounting | Not available; tool output token counts are not model usage | Null, not estimated |

The isolated-output probe did not receive oracle or other-arm data. Its final answer
matches the complete normal/strict findings saved in `audit-tool-responses.json`.
The isolation probe deliberately read only an authorized harmless canary; no real
oracle, credential or other application's data was accessed for this check.
This demonstrates capability to cross the workspace boundary, not contamination of
any scored run (none occurred).

`output-agent-final.json` and `isolation-agent-final.json` preserve the participants'
final JSON. Raw execution responses are stored alongside them. The output participant
reported a failed file-patch attempt followed by a successful save; this was not an
extra audit command or model retry. A complete platform tool-event transcript was
not exported, so these artifacts must not be described as such. Successful response
capture and exact final-answer reconstruction support this narrow forwarding test.

## Decision required before scored execution

The current protocol requires a fresh independent sandbox exposing only the assigned
packet. Fresh conversation alone does not satisfy that contract. Do not silently
weaken it, hide this failed gate, or count these two probes among the 96 trials.

Available next paths:

- Amend the next phase to an explicitly exploratory Work fresh-agent pilot with
  instruction-scoped access and audited tool-use records. Preserve this isolation
  failure; do not call that environment physically sandboxed or results blinded
  against accessible oracle files. Explicit model/reasoning selection and a viable
  record of tool accesses must be settled before its new freeze. This is a protocol
  choice requiring user acceptance, not a completed workaround.
- Keep the existing physical-isolation contract and execute using an external
  configured runner with separate participant environments, no oracle/network access
  and exact model/reasoning/budget metadata. Verify those properties before the full
  study. Merely installing a CLI in the same shared workspace does not fix isolation.

No new paid API calls, environment provisioning, policy changes or main merges were
performed. Keep the existing scored-study gate closed until the next path is chosen
and validated. Previous SQLite preflight remains deterministic mechanism evidence.
