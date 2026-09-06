# Discovery followed by covered-site triage

This diagnostic cohort implements the user's explicit separation. Discovery recall
and location errors are separate outcomes. Covered-site triage compares the same
AI-discovered set in both arms; it is conditional on that set, not a claim about
whole-program safety. No Rules/layout or business-defect score is included.

## Discovery and matching

Two fresh Luna/medium discovery agents see only each Raw application's source. They
return direct execution locations, without construction judgments or evaluator gold.
Keep their original answers. Score exact file/line/function matches and misses against
the independent existing gold separately. Do not silently fill undiscovered functions.

Source-only AST matching reconciles each reported location. If the reported location
is wrong but its function name uniquely identifies an execution function, normalize
that location and record the correction. Ambiguous/missing names must remain unmatched;
never resolve using gold. This policy was introduced after a billing discovery agent
mislocated two correctly named functions in api.js. Disclose that adaptive correction
and do not claim exact discovery recall improved. Both triage arms receive the same
normalized IDs. Raw/Serene source layout and function names were preserved by conversion.

For Serene, actual compact CLI output is paired with an internal full-row coordinate
matching pass. Only the compact output and input-set reconciliation reach the reviewer;
no ordinary SQL bodies are delivered. This harness matching is not a shipped Serene
manifest or whole-program feature. Precomputation cost is separate from returned review
context; do not claim an end-to-end CPU/runtime win. No gold is used for matching.
Unmatched input sites are actionable even if they look familiar. Matched ordinary
sites need no individual construction investigation unless contradictory evidence
arises. The non-exhaustive discovery caveat cannot justify rereading them.

## Covered-stage treatment

Raw: inspect/screen the supplied site set with source tools and follow provenance
where needed. Serene: retrieve the matched compact audit first, skip matched ordinary,
then inspect actionable and unmatched sites. This measures an explicitly followed
review workflow, not spontaneous optional audit adoption. Both have identical exact
AST function ranges and targeted dependency/caller ranges. The prior adjacent-import
span error is removed. Discovery source/search output is not passed to either agent.
General search/discovery is outside this stage; provided site IDs define its scope.

Both may read CONTRACT.md and source ranges. Unknown tool parameters are rejected;
there is no silently ignored per-file audit option. Finish is available after a cap.
The controller reports actual JSON response-text bytes (framing, errors, newline).
Caps: 32,768 bytes of response, 80 requests, 600 seconds from first action. Error/control
responses may add charged bytes after the source cap. No source is delivered past caps.
Checkpoints 4,096 / 8,192 / 16,384 / 32,768 are observations, not separate budget cohorts.
Model/token usage and physical filesystem isolation are not claimed.

## Outcomes

Report independently:
1. Discovery exact recall, false locations and deterministic location normalizations.
2. Matched ordinary skip eligibility and actual source-body omission; Raw screening
   bodies/response volume; N/body and additional-context acquisition.
3. Correct dangerous-construction discovery at fixed byte checkpoints and final cap;
   bytes/actions at first correct submitted finding and terminal state, retaining censoring.
4. Unnecessary ordinary rereads, unsupported calls, response-format/termination failures.

A candidate-site/function counts as exposed only if a source-tool response overlaps
its exact AST function body. Audit counts are not source exposure. This remains an
exposure proxy, not a direct measurement of mental effort. Report mixed screening/
follow-through reads without fabricating a per-site mental cost. Bytes are a token
proxy, never tokenizer or monetary measurements.

Same two small task sources/gold as earlier diagnostic cohorts, one Raw/Serene pair
per task, four fresh Luna/medium sessions t01/t02 billing then t03/t04 warehouse, at
most two concurrent. No post-answer replacements, no pooled significance or production
utility claim. Sources, gold, tools, input sets and prompts freeze before dispatch.
Independent adjudication receives shuffled claims/source/gold without cost metadata.

Before scored dispatch, two fresh agents must demonstrate on a distinct three-site
calibration that Raw screens the common set and Serene actually leaves ordinary
bodies unread while investigating its actionable site. Output delivery alone is not
sufficient. If this behavioral gate fails, do not launch scored runs. Correct the
workflow and calibrate again, preserving failures. No extra human planning approval
is needed. Keep PR Draft.
