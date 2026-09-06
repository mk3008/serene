# Discovery mechanics observation

Question: how do fresh coding agents discover SQL execution sites in this Work
local-repository environment? This is not Serene efficacy, triage or SQL-injection
review. Do not run Serene or supply any existing triage results to participants.
Observe three new small TS/JS repository tasks with different access structures,
one fresh gpt-5.6-luna / medium agent per task. No comparison of models or strategies.

## Environment and observation

Participants choose command sequence, search terms, regex, source reading and
structural analysis themselves. The recorder forwards argv unchanged to normal local
commands and stores every command, stdout/stderr, exit, timing and delivered bytes.
Pipes are available through bash -lc. It does not implement grep, preselect query
keywords, expose an execution index, resolve names or impose a fixed search strategy.

Available local facilities include shell, rg, Node and Python. The parent environment
provides the TypeScript compiler package. No local semantic-index search or running
language-server symbol/reference service is configured. Remote GitHub search tools
exist but these new local tasks are not indexed as independent remote repositories;
searching the Serene research repository would leak evaluator material and is excluded.
The environment's general coding instructions prefer rg as the first text search.
Therefore observed rg use cannot establish a universal agent preference over available
semantic search. Record unavailable versus available-but-unused separately. Agents
may perform their own AST/symbol/reference analysis through local commands.

All source access goes through a command-transparent recorder, which adds invocation
and logging overhead. This is natural choice of commands within an instrumented local
environment, not an untouched IDE session. Mediation is instruction-based, not physical
sandbox isolation. Native raw tool transcripts are not independently exportable here;
command/response logs are the objective source-access record. Do not claim perfect
observation of unlogged bypasses, private thought or all environment tool internals.

Subagent use is optional, not encouraged as a strategy. A participant may delegate
bounded discovery with the same Luna/medium setting and recorder run; record delegation
notes and retain the actual collaboration tree. Source commands of any delegate use
the same recorder. No required parallel subdivision or hidden investigator help.

## Candidate evolution and truth

When a result changes the working candidate set, the participant records a complete
snapshot {file,line,function,status,evidence?}; status is tentative or confirmed.
The recorder computes additions, removals and status changes between snapshots.
Candidate belief states are contemporaneous self-report corroborated by command
output, not automatically recovered mental states. Recording them may affect pace.
Do not retrospectively manufacture intermediate candidate sets from the final answer.

The final snapshot is scored against a separately prepared gold inventory. Count
actual driver execution invocations; a forwarding wrapper's concrete driver call is
one execution site and its callers are separate follow-through metadata. Preparing
without executing, generating/logging SQL text and non-database query methods are
negative controls. Public driver contracts clarify this boundary without giving a
site inventory. Preserve mistaken coordinates; no post-answer repair for recall.
Report exact file/line recall/precision plus function-level location errors separately.

Report per task: command counts, search terms, rg/grep/regex, structural/semantic/
symbol/reference techniques, wrapper/alias/import follow-through, subagent use,
candidate additions/removals/status changes, recall/precision, full delivered bytes,
command wall time and total elapsed time. Source command cost, snapshot/notes overhead
and final-answer formatting are separate. No monetary/tokenizer counts inferred.

Operational ceilings:120 recorder actions,900 seconds per run,45 seconds per command,
120000 characters each for stdout/stderr delivery. Raw output is retained separately
if truncated. Ceilings are emergency bounds, not comparative discovery budgets. No
scored retries or model changes. Independent source/gold review precedes observation;
a small unrelated recorder calibration verifies argv/output/snapshot preservation.

## Completion and integration decision

Freeze task/gold/prompt/recorder/environment metadata before participants. Archive all
trajectories and score independently. Only after observing them choose a connection
recommendation: rg/pipe adapter if the observed candidate production supports it;
tool-independent candidate records if output is heterogeneous or portability requires
it. Explain environment-conditioned limits. Do not implement a production connector
before observation. Any eventual candidate input must retain unknown/unmappable sites
as unmatched/review-required and leave undiscovered-site responsibility in Discovery.
Keep this evidence separate from covered-site response reductions and keep PR Draft.

Observation staging: each task is a separate local Git repository with no remote or evaluator files. NODE_PATH exposes the installed TypeScript package. Three participants may run concurrently. Primary scoring uses every final candidate (including tentative), deduplicated by file/line, against exact gold file/line; function labels are reported separately. No coordinate repair.
