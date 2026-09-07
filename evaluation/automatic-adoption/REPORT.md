# Automatic-adoption instruction pilot — scored-run report

## Result

The scored coding pair used different construction paths: presence r07 used
native bound SQLite SQL, while instruction r08's final artifact uses Serene fixed
SQL and named binding. r08 has no command capture, so its acquisition path, CLI
use, and process cost are unavailable. Both scored construction reviewers (r09
instruction and r10 presence) have recorded CLI executions; that is an
observation, not proof that the CLI caused their review outcomes. The
authorization tasks inherited Serene construction and therefore are not
construction-adoption comparisons.

Separately, the artifact-first adjudication records a passing task outcome for
every run: coding r07/r08, construction review r09/r10, and authorization
follow-up r11/r12. These are three distinct outcome families, not a pooled
product or safety score. The outcome records and their source evidence are in
[results/scored/adjudication-outcomes.json](results/scored/adjudication-outcomes.json).

The treatment is the frozen 53-word root-instruction bundle versus package
presence with the same installed local documentation. This is one matched pair
per workflow (`n=1` pair each), so it supports only concrete within-task
observations. It does not establish a global minimum instruction, a general
adoption rate, a package-effect estimate, or a causal claim.

## Frozen cohort and evidence boundary

The scored dispatch maps r07/r08 to coding (presence/instruction), r09/r10 to
construction review (instruction/presence), and r11/r12 to authorization
follow-up (presence/instruction). All requested fresh sessions used
Luna/medium. The dispatch records local checkpoint
`d27f74040d03f2d2846aafc3b20ffa0285b5f01d` and published-matching-tree hash
`c8355e5d0204ee08c16258999ff434445a84f6d9`. After the root fetch, both commits'
trees resolve to `26c0c2d4385222b78d48f827df5c1538377bd31c`; the equal-tree
checkpoint is therefore verified.

The six calibration sessions are a separate interface-validation stage and are
not pooled with the six scored sessions. Calibration caveats remain archived,
including r04's output-threshold breach, outside-packet temporary audit file,
heredoc errors, and requested-artifact naming behavior.
The calibration presence coding artifact also used Serene, so neither stage
supports a claim that presence alone never leads to Serene use.

For all scored runs, the stage-harvest packet recursively matches the last
recorded `final_snapshot` inventory and hashes. Captured stream hashes also
verify for r07 and r09–r12. r08 is different: it has two final-snapshot events
and a retained changed final artifact, but no `command_started` or
`command_finished` events. Its captured stdout/stderr values are zero because
capture is absent, not because work, time, CLI use, or cost was zero. It is not
rerun or reconstructed.

The post-freeze reporting helper now represents no finished commands as
unavailable integrity/process output rather than a failed stream check. That is
a reporting-only correction; it does not alter the frozen participant packets,
prompts, runner, gold, or source checkpoints. Raw archives are immutable and
the report metadata is separate from them.

## Artifact outcomes

| Workflow | Presence | Instruction | What was separately adjudicated |
| --- | --- | --- | --- |
| Coding | r07: pass | r08: pass | Native functional behavior, validation before database access, binding, required projection, seed preservation, and no observed harmful SQL rewrite. r07 uses native positional binding; r08 uses Serene fixed SQL and named binding. |
| Construction review | r10: pass | r09: pass | The required `forAccount` concatenation finding; retained/source-resolved `paid` provenance follow-up; scoped treatment of the ordinary `invoice` path. A complete site inventory was not required. |
| Authorization follow-up | r11: pass | r12: pass | The cross-tenant authorization diagnosis: the request controls the tenant predicate while the actor is ignored. The fixed/parameterized construction classification is separate from that defect. |

Neither authorization task is construction-adoption evidence: both inherited the
fixture's Serene construction and were asked to investigate access control. An
ordinary result is not evidence that SQL meaning, binding use, authorization, or
business behavior is correct.

## Recorded process observations

| Run | Workflow / arm | Recorded shell commands | Raw stdout / stderr bytes | Recorded CLI execution sequence IDs | Trace observation |
| --- | --- | ---: | ---: | --- | --- |
| r07 | coding / presence | 8 | 9,614 / 8,706 | none | Read source and installed README, then edited and recorded normal/direct checks. |
| r08 | coding / instruction | unavailable | unavailable | unavailable | No command events; final code remains independently judgeable. |
| r09 | review / instruction | 3 | 2,728 / 198 | 1, 3 | The recorded log begins with audit; actual source-read ordering is unestablished. Sequence 3 runs normal checks before actionable-only audit. |
| r10 | review / presence | 11 | 20,338 / 1,814 | 4, 5 | Full source and local documentation were read before CLI invocation; the first CLI argv is malformed and masked, the second returns the actionable counts. |
| r11 | authorization / presence | 8 | 3,787 / 8,766 | none | Recorded cross-tenant reproduction and normal checks. |
| r12 | authorization / instruction | 6 | 18,191 / 7,747 | 4 | Source/docs read before the command that writes the review, checks, and invokes the audit. |

“Recorded CLI execution” means a recorded argv invoking `serene-audit` or
`node .../tooling/cli.mjs`; it does not count a string mention in documentation,
a shell quote, or a final answer. Invocation, output reading, and any later
action are process observations, not success criteria or proof that the CLI
caused an outcome. r09's log starts with audit but contains no recorded
source/task/documentation reads, so it cannot establish actual read ordering.
r10 and r12 have recorded source reads before audit. r10 sequence 4 is an
actual but malformed CLI argv whose error is masked by `|| true`; its sequence 5
invocation is the relevant actionable result. These traces do not
test pre-exposure filtering and do not support an Issue #7 benefit claim.

The process data is available in
[results/scored/process-adjudication.json](results/scored/process-adjudication.json).
Raw process bytes, command counts, and elapsed time are partial descriptive
shell-recorder values. They exclude initial prompt bytes, wrapper/model context,
reasoning, and any unrecorded activity; they are not total AI cost, tokens,
billing, or latency. r08 has no command capture at all, and the other five logs
remain evidence of reported shell activity rather than complete activity traces.

## Deterministic CLI-size observation

As a separate read-only check, the installed r09 CLI was run from
`/tmp/repository-agent-study/r09` on its frozen, unchanged `app.mjs` and
`database.mjs`, once normally and once with `--actionable-only`. The exact
command was `node node_modules/@mk3008/serene/tooling/cli.mjs app.mjs database.mjs`;
the default JSON was 1,583 bytes and the actionable-only JSON was 925 bytes.
Both exited 1 because the same fixture retains a violation. The exact argv,
working directory, output hashes, and raw JSON are archived in
[results/scored/cli-size-check](results/scored/cli-size-check/metadata.json).
This is a deterministic output-size observation for one fixed source, not an
agent-process measurement, adoption result, or causal cost claim.

## Limitations and recommendation

The tasks are tiny, self-contained native-SQLite fixtures: the review and
authorization fixtures use the public `query(text, params)` adapter, while the
coding fixtures execute through native `db.prepare`; both arms had local package
documentation. The recorder is an instructional boundary, not OS-enforced isolation; recorded
commands cannot prove absence of unrecorded access. In particular, r08 has no
process trace, so no CLI or cost comparison can include it.

The generic participant prompt explicitly asked both arms to read and follow the
root `AGENTS.md`; the study therefore tests the content of the repository rule
conditional on that workflow, not automatic discovery of `AGENTS.md` itself. The
presence arm had no Serene task cue, but both arms had the authored tiny fixture
and an explicit local README/package cue.

Keep the tested 53-word bundle as the candidate policy for this narrow task
family. The cohort does not prove it is globally shortest, and no scoped failure
here identifies a reason to lengthen it. Any wording replacement should therefore
be a separately frozen later stage tied to a specific, predeclared failure—not a
post-hoc adjustment to these outcomes.
