# Automatic-adoption instruction pilot

## Status and question

**Status: planned; no calibration or scored runs have been performed.**

This is a small, instruction-mediated pilot. Its question is whether adding the
frozen repository instruction bundle to an otherwise identical package-present
repository changes fresh-agent behavior in three workflows: coding, SQL-construction
review, and authorization follow-up. It evaluates the bundle, not the globally
shortest instruction, the package's effect in isolation, a general adoption rate,
or a causal comparison of agent populations.

The research boundary in [the evaluation map](../README.md) applies. Construction
provenance, native functional correctness, and authorization/business behavior are
separate outcomes. No pooled product score is permitted.

## Frozen treatment

Every participant receives the same initial task text, repository packet, installed
package, package documentation, native driver contract, normal checks, model alias,
reasoning setting, resource caps, recorder, and source revision. The **only**
intentional treatment difference is the root `AGENTS.md` file.

The instruction arm uses this three-sentence bundle (53 words):

> Use `@mk3008/serene` as the default construction path for executable raw SQL; if
> it cannot preserve needed SQL behavior, keep the exception explicit for additional
> review. For SQL-construction review, use the installed `serene-audit` and keep
> unresolved paths in review. Use ordinary results to skip redundant
> construction-provenance review, not SQL meaning/binding, authorization, or
> business-behavior checks.

The presence arm has no Serene-specific instruction in `AGENTS.md`. It may discover
and use the same installed package, CLI, README, and package documentation normally.
The bundle combines an adoption cue, an audit-use cue, and a scope-calibration cue;
results cannot attribute behavior to one sentence or clause. It is a candidate
minimal bundle only. A longer replacement requires a separately frozen later stage
that identifies a specific failure the replacement addresses; calibration and scored
outcomes may not be used to tune this wording.

Normal repository checks do **not** invoke Serene audit. The participant is never
told an expected command, sink, path, SQL-site count, hazard count, taxonomy, or
source location. Package docs and task text must not become a hidden complete
inventory or gold-derived review corpus.

## Packet and runner contract

Each pair is a matched small task: exact packet bytes are identical except for the
root `AGENTS.md`. Participant instruction text uses one frozen template; its own
run-root, evidence-path, and run-ID substitutions are the sole operational
path-specific differences and are recorded with canonical template hashes. Before
dispatch, freeze and record:

- initial text and all public task files;
- package, lockfile, installed Serene version, CLI `--version`/`--help` availability,
  README and package-documentation bytes; the same installed local documentation path
  and bytes are available in both arms;
- normal check commands and their expected no-audit behavior;
- task/fixture hashes, model alias (`Luna`), reasoning (`medium`), a 30-command cap,
  120-second per-command timeout, a 24,000-byte post-hoc raw-process-output breach
  threshold, runner version, setup-assigned counterbalanced run IDs and arm order,
  and scoring rubric.

Use a fresh Luna/medium session for every run. All sessions use the same model
setting and caps within the pilot. The study records the requested setting, not an
unavailable served snapshot. There are no retries, substitutions, or relabeling of
failed runs. Archive failures and recorder errors as such.

Construction-review and authorization-follow-up fixtures use the same small public
native-SQLite adapter: its `query(text, params)` method passes the supplied text and
named parameters to native SQLite and returns rows. `query` is an ordinary application adapter and a default audit sink,
not a Serene controller; its identical source and driver behavior are frozen in both
arms.

The runner provides only the neutral generic interface:

```text
/tmp/repository-agent-study/runner.py command --root <packet-root> --log <events.jsonl> -- <command> <args>
/tmp/repository-agent-study/runner.py finish --root <packet-root> --log <events.jsonl>
```

`command` logs the command before execution, then losslessly records argv, actual
stdout, actual stderr, exit status, timestamps, and returned bytes. `finish` records
the final participant snapshot. The interface neither contains Serene-specific
operations nor forces a command, supplies an audit result, filters output, or exposes
an inventory. Preserve the same output limits for both arms. Participants use
`max_output_tokens: 30000` for `tools.exec_command`, and the runner uses
`max_output_tokens: 30000` for its `functions.exec` response. The 24,000-byte
setting is a post-hoc breach threshold: the recorder preserves raw process output,
then marks a breach without changing the child exit status; it does not truncate the process stream. The
stage wrapper must pass this threshold on every command in both arms. Before freeze,
verify that an invoked CLI's output is visible to the participant and captured by
the recorder; this is delivery validation, not a requirement to invoke the CLI. If
an outer tool response is actually truncated in a scored run, mark that cost
measurement incomplete and preserve the result; do not rerun the scored session.

The boundary is instructional, not OS-enforced isolation or a complete platform
trace. The command log is evidence of reported shell activity only; it cannot prove
that no unrecorded access occurred.

## Workflows and outcomes

All tasks use a native functional harness independent of Serene. Functional tests
must accept compliant native solutions in either arm.

| Workflow | Task contract | Primary outcomes | Separate observations |
| --- | --- | --- | --- |
| Coding | Implement an executable-SQL feature and an independently required non-SQL validation/error-handling change. | Native functional correctness; eligible-site Serene adoption; correct SQL/value binding; explicit justified exception; no unsafe bypass or harmful rewrite. | The non-SQL acceptance result is a negative control and is reported separately. CLI use is observational only. |
| Construction review | Review SQL construction/provenance only. | Frozen construction-gold recall, unsupported accusations, source evidence, and whether any CLI result was discovered and correctly applied. | Exclude authorization and business defects from this score. Commands, output bytes, and time describe workflow activity only. |
| Authorization follow-up | Investigate a clearly requested access-control question. Include one real authorization defect in a fixed, parameterized query that can be classified ordinary for construction. | Authorization diagnosis and remediation/response correctness; no claim that ordinary proves authorization. | Record over-trust explicitly when a participant treats ordinary provenance as authorization or business assurance. Do not count this defect in construction performance. |

The coding negative-control work is inside the requested task and acceptance suite,
not an unrelated surprise. Its independent result checks whether the treatment is
associated with failure on ordinary non-SQL work; it is neither a safety score nor an
adoption denominator.

## Calibration, freeze, and scored runs

Run exactly one **non-overlapping calibration pair** for each workflow first: six
fresh Luna/medium calibration sessions in total. Setup assigns counterbalanced run
IDs and arm order before dispatch; report IDs and the frozen mapping with results.
Calibration tasks validate only interfaces and contracts: matched packets apart from `AGENTS.md`, fresh-session
setup, package/docs/CLI availability, normal check behavior, recorder preservation,
functional harnesses, and scorable output capture. They do not tune the instruction
bundle, test content, inventory, or scoring after behavior is seen. Calibration
results are archived and excluded from scored outcomes.

Only after both calibration sessions for every workflow pass the interface gates,
freeze six distinct scored packets: one new matched pair for coding, construction
review, and authorization follow-up. These six scored sessions are the initial
ceiling. Scored tasks must differ from calibration tasks and from one another while
preserving the frozen workflow contracts. Do not reuse a calibration result as a
scored outcome.

If a calibration gate fails, archive it and repair the interface with a new
calibration stage before any score-task freeze. Do not silently rerun a participant
or alter the instruction in response to behavior.

## Scoring and reporting

Freeze hidden gold and scoring rubrics outside the participant packet. Prompts,
`AGENTS.md`, README/docs, test names, check output, and recorder responses must not
leak a complete inventory, expected count, or gold-like classification examples.
Where feasible, have adjudication receive arm-hidden final artifacts; disclose that
source changes can still reveal treatment.

Report each task pair side-by-side with denominators, raw final artifacts, recorder
trace, normal checks, functional evidence, and separate outcome tables. Never treat
multiple sites in one task as independent trials. Record initial-prompt bytes
separately. Recorded stdout/stderr bytes are raw process output, not necessarily the
exact bytes delivered to the model after execution-wrapper JSON or tool metadata.
They exclude wrappers, initial prompt, reasoning, and all other model context, so
they are not total AI cost. Command count and elapsed time are likewise descriptive;
do not infer tokens, billing, or model cost.

CLI invocation, audit-output reading, and subsequent use are process observations,
not success criteria. An optional `--actionable-only` table may describe sessions
that independently ran the same deterministic audit command and the result they
received. It is conditional on self-selected invocation and therefore observational.
It cannot establish that the output caused a later action. A matched same-output
counterfactual requires a later separately frozen third arm that gives identical
saved output to both conditions; it is outside this pilot.

With one matched scored pair per workflow (`n=1` pair each), report concrete
within-task observations and failures only. Do not report rates, statistical tests,
general adoption claims, a package-effect estimate, or causal adoption claims.
