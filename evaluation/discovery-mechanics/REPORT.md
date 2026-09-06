# Discovery mechanics observation

Three fresh Luna/medium agents used `rg` plus source reads to find SQL execution
sites in three new, small authored TypeScript repositories. All 16 final file/line
locations match the frozen inventory. This is a local discovery observation, not
Serene effectiveness evidence or a comparison of search strategies.

The immediate recommendation is a **thin candidate handoff**, optionally piped from
a Discovery-owned adapter, rather than making Serene own a search engine. The
observed workflow supports trying shell integration here; it does not establish
that raw grep matches alone are adequate or that agents in other environments
prefer grep. No production integration was implemented in this observation.

## Conditions and evidence

[Protocol](PROTOCOL.md), [exact participant prompts](prompts/), task contracts and
gold were frozen locally in `b974de6` before participant launch, then published as
`9c83ce5568d7d6117ec80fe5ebe330cd8574f036` while participants ran. There was no
post-launch task/prompt/recorder change. [Hashes](freeze.json) and
[post-run integrity checks](integrity.json) preserve this boundary. Each participant
received a fresh context and one isolated Git repository, with no evaluator files
inside it. The actual launch instruction was: execute that run's frozen prompt,
read only that instruction initially, then follow it; no evaluator/other-task reads.
There were three concurrent runs, no retry, and no participant-spawned subagents.
The author and independent preflight validator were separate Terra/medium agents.

[Initial validation](validation.json) found two public-contract ambiguities; the
[pre-launch amendment](preparation-amendment.md) and
[follow-up](validation-followup.json) resolved those without changing source/gold.
The recorder integration test passed. This tests recording, not discovery ability.

Available facilities were shell, rg, Node, Python and the installed TypeScript
package. A local semantic index and language server were unavailable. Remote code
search could not access these isolated local repositories. The inherited coding
instructions prefer rg first. Thus tool availability and instruction bias prevent
an unrestricted claim about agents' natural tool preferences. Reading the public
README was also explicitly requested; it names the execution APIs and reduces the
search problem. Repositories contain only 6–8 TS files each (130–132 source lines),
not large production systems, dependencies or dynamic driver implementations.

## Recorded methods

| Run | Search and read sequence | Wrapper / alias / import tracking |
| --- | --- | --- |
| d1, driver-operations | cwd → README → `rg --files` → method-call regex with context → all six source files with `nl` | Full source read links main's imported helpers to driver calls. No dedicated reference-search tool. |
| d2, wrapper-aliases | cwd/list/README → file listing and all eight source files → driver/re-export regex → explicit name/alias regex | Second content search follows `dispatch/fetchRows/watchRows/arrive/lookupDock` through re-exports, helper definitions and callers. |
| d3, mixed-ledger | README file search/read → source file listing → method/type-name regex → six selected source files | Text and source inspection connect transaction callbacks and `LedgerStore` methods to session executions. `presentation.ts` appears in search output but is not read in full. |

There were 4 content-search commands total (d1:1, d2:2, d3:1), all regex searches
with `rg`; file-listing rg invocations are separate, not semantic search. No AST,
compiler-symbol/reference lookup or semantic-search operation was observed. No
participant delegated work. Name/reference tracing was textual reasoning over
source and regex results, not a symbol engine. No command failed or had recorder
output truncation.

The exact argv, search expressions, full stdout/stderr, timings and candidate
snapshots are preserved in [d1](results/d1.jsonl), [d2](results/d2.jsonl), and
[d3](results/d3.jsonl). Readable trajectories are alongside them. In particular d2
searches all the discovered helper names, rather than only `query/execute`.
Search output contains preparation, type declarations, aliases and presentation
text; the final candidate list is an agent interpretation, not raw match output.

## Candidate evolution and scoring

| Run | Recorded candidate transitions | Exact recall | Exact precision |
| --- | --- | --- | --- |
| d1 | Event 6: add six confirmed; event 8: unchanged | 6/6 | 6/6 |
| d2 | Event 4: add five confirmed; event 7: same locations, five evidence-text updates | 5/5 | 5/5 |
| d3 | Event 7: add five confirmed; then finish | 5/5 | 5/5 |

No candidate was recorded as tentative or removed. Notes explain exclusions, but
there is **no observed tentative-to-rejected trajectory** to analyze. Most candidate
state was emitted after source inspection, despite the instruction to snapshot
changes. We cannot determine unreported internal candidate states, reconstruct them
retrospectively, or claim complete belief-state capture. d2 alone has a content
search after its first snapshot. The snapshot mechanism worked, but observation of
incremental narrowing was limited by this behavior and the small tasks.

All final candidates are scored by exact file/line with no repair; function labels
also match. Wrapper callers are supplemental, not counted again as executions.
These ceiling results show successful discovery on these fixtures, not general
recall/precision or reliable exhaustive discovery. In d3, the note attributes
prepare's non-execution to README, although that README explicitly names only the
execution APIs and transaction semantics; prepare's return type is in the source.
That explanatory over-attribution is preserved, not silently corrected. No Serene
safety score is derived from these classifications.

## Discovery cost

| Run | Recorder exec commands | Command response bytes | Recording response bytes | Observed wall seconds |
| --- | ---: | ---: | ---: | ---: |
| d1 | 5 | 8,889 | 278 | 41.65 |
| d2 | 4 | 10,027 | 278 | 36.56 |
| d3 | 5 | 6,817 | 193 | 33.19 |

[Deterministic scores](scores.json) are regenerated with `python
 evaluation/discovery-mechanics/score.py` (one shell line). Command bytes count the
recorder's UTF-8 JSON response, including escaping/metadata; separate recording
bytes count snapshot/note/finish responses. Full prompts, agent messages, tool-call
arguments, native tool envelopes and tokenization are excluded. These are not total
context tokens, monetary costs, or comparative efficiency estimates. Wall time is
first recorder invocation to finish, includes agent deliberation/recording pauses,
and excludes launch/prompt load/final response. Command subprocess durations are
stored separately. Tiny local commands and concurrent scheduling make latency
unsuitable for model-performance inference.

The recorder archives all source/search commands submitted through it and their
unabridged outputs. This environment does not expose a native complete transcript
export; instruction-mediated access is not an OS sandbox. Therefore this is **not a
claim to preserve every native tool event or prove no unlogged access**. Final
summaries and the observed agent tree are archived separately. The immutable staged
sources and recorder hashes passed integrity verification after all runs.

## Connection decision after observation

Prototype the handoff at the **agent's selected candidate set**, not at the raw
regex-match set. A Discovery-owned shell adapter can pipe JSONL into triage, or save
the same records to a file. This follows the observed shell usage while leaving
room for other search tools; semantic/mixed-tool environments remain unobserved.
Do not build a semantic-search integration or claim an optimal universal interface
from these three runs.

A proposed record needs a stable candidate ID, repository/source revision, file,
line (and column/range when available), optional function, discovery evidence/tool
origin and site kind (execution versus caller/unknown). These are an interface
proposal, not a shipped schema. Missing or ambiguous coordinates, unknown execution
kind, stale revisions and unsupported source paths must remain visible as
`unmatched` / `review-required`. Never drop them or infer ordinary from absence in
an actionable-only list. Match against a positive ordinary classification at the
same execution location/revision. A generic wrapper's classification must not be
propagated to all callers without supported provenance.

The intended ownership stays: AI discovers candidates → Serene classifies what it
can positively match → AI skips matched ordinary construction and examines
actionable/unmatched construction. Discovery misses remain a separate coverage
risk, and business semantics remain outside construction triage. This observation
does not test the candidate matcher, ordinary skipping, or end-to-end savings.
The earlier approximately 35% covered-stage response-byte reduction is a separate
[cohort](../triage/covered-study/REPORT.md) and is not pooled with these costs.

The next bounded implementation experiment would test candidate preservation and
matching with explicit unmatched/stale/wrapper controls before another savings
claim. PR #4 remains Draft; existing runtime, audit implementation and earlier
frozen studies are unchanged by this task.
