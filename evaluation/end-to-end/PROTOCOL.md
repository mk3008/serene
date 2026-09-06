# End-to-end workflow comparison

Question: does reduction in construction review outweigh Discovery and actual JSONL
handoff/triage output costs in a small, explicitly instructed AI workflow?
No production change, general vulnerability-review claim or pooled historical result.

Two new paired TS applications; one fresh Luna/medium agent per arm per task (four
scored runs). Each independently discovers its own variant and then reviews in the
same context. No supplied candidate/site index, location reconciliation or gold.
Both arms have identical read and regex search facilities and budgets. SQL behavior
is paired; source representation differs (raw literals versus Serene construction).
Discovery differences are reported, not attributed to triage. Paired total costs do
not by themselves isolate a causal triage effect; stage costs expose the distinction.

A separate four-site calibration pair precedes scored freeze. Gate: Raw exposes
ordinary source for self-screening; Serene submits discovery, calls real handoff,
does not expose ordinary bodies again afterward, and reads actionable/unmatched
bodies at least once and resolves them in dispositions (prior evidence may be reused). Both preserve all submitted candidates and
correctly diagnose the dangerous construction. Failure stops scoring, without
increasing scored runs. Any calibration-led change is recorded before freezing.

Agents use source-only mediated info/read/search, submit their own discovery list,
then screen/review. Search executes rg, returning all matched source lines (not a
sink index). The mediation allows exact response and source-line accounting; it is
not unrestricted IDE usage. Semantic/LSP is unavailable. A full-source read during
Discovery is permitted and charged, and can erase later skip savings. No controller
suppresses ordinary reads: skip behavior must be observed, not forced by an access
error. All candidate IDs/coordinates are agent-produced. No correction after answers.

Serene uses the real evaluation candidate-handoff CLI, returning its entire output
including input echoes and failures. Raw screens without audit. Every candidate
must receive a final disposition. Finding submissions are allowed during Discovery
and must be made immediately when justified: an early diagnosis is counted, not
artificially delayed until triage. Continue through the whole workflow afterward.

Primary descriptive outcomes per run: cumulative response bytes at first correct
construction diagnosis (or not reached), full workflow response bytes and dangerous
site diagnosis recall/false findings. Separately: exact Discovery recall/precision,
candidate counts, handoff input/output/loss, classifications/unmatched reasons,
ordinary body exposure during Discovery and after handoff, source text bytes/unique
lines, search/read/all calls, request JSON bytes, handoff JSONL input/output bytes.
Subprocess output delivered inside response JSON is charged through that response;
raw subprocess sizes are components, not added again. Prompts, model reasoning,
final chat, native tool envelopes and tokenization are outside response-byte counts.
No monetary or total-token claims. Wall durations include orchestration latency.

Ordinary skip means no source line in its function range was delivered after the
successful handoff, with explicit skip disposition. It does NOT mean the body was
never seen during Discovery. Report both. Read and search exposures both count.
Dangerous finding needs accurate untrusted input -> SQL syntax evidence and impact,
not merely echoing an audit violation label. Discovery matching uses exact gold execution coordinates. Diagnose a danger by
correct file/function, reported line within that function, and mechanism; no
rewriting of answers. A finding may point to the construction or execution line. Fixed cases and observed unmatched are not silently
removed from denominators. Duplicate candidates remain individual handoff records.

Operational bounds: 100 requests, 900 seconds, 65536 cumulative response bytes,
checked before each operation (one response can cross the threshold); finish remains
available. Four runs only, no retry or treatment coaching after scored freeze.
Tasks/gold/controller/prompts/config freeze after calibration; verify integrity after.
Results remain separate from covered-study's ~35% result. Complete this comparison
and close this evaluation track as a research checkpoint; keep PR Draft and leave
production, scale and further research to separate tasks.

Calibration v1 and subsequent measurement corrections are preserved in calibration-amendment.md. Read end bounds clamp at EOF; invalid start/range still errors. A fresh calibration pair verifies the corrected method before scored freeze.
