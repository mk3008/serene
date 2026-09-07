# AI adoption guide

Serene is an optional repository convention for teams whose AI agents work on
raw SQL. Install the package and keep its local README and documentation
readable to the agent. The package adds a recognizable construction boundary;
the native SQL text and the native driver remain the application’s
responsibility. Serene does not replace review of SQL meaning, value-to-driver
binding, authorization, or business behavior.

If the repository wants a default for construction and review work, its root
`AGENTS.md` (or equivalent instruction file) is the durable owner of that
policy. Add this short instruction there:

```text
Use `@mk3008/serene` as the default construction path for executable raw SQL; if
it cannot preserve needed SQL behavior, keep the exception explicit for additional
review. For SQL-construction review, use the installed `serene-audit` and keep
unresolved paths in review. Use ordinary results to skip redundant
construction-provenance review, not SQL meaning/binding, authorization, or
business-behavior checks.
```

This instruction is optional. It sets a repository default for how an agent
constructs executable raw SQL and approaches construction-provenance review;
it does not guarantee that every agent follows it or that every path is saved,
audited, or classified. The task prompt should still state the ordinary business
or review goal. The team should configure and verify its platform's repository-
instruction loading mechanism; installed package/docs availability does not
confirm that an agent ingested them, and neither package presence nor a harness
creates a universal audit requirement.
Agents should use the installed package and inspect the local documentation when
the task calls for it. A Serene audit is an inventory
of recognized ordinary construction and candidate execution paths within its
source-coverage scope. Ordinary means recognized construction provenance only;
unresolved or review-required paths stay visible for inspection. Read the
[security contract](security.md) and [review coverage](review-coverage.md) for
the limits and the application’s review duties.

For a task that is purely about authorization, an audit is not mandatory merely
because Serene is installed. Investigate authorization directly, and do not
treat ordinary construction as evidence that access is correct. Run the audit
when construction provenance is part of the task or when it helps inventory
changed SQL paths.

Serene does not choose the application's SQL file layout. Imported definitions may
remain review-required; follow their binding/execution path instead of relocating
or duplicating SQL to satisfy a gate. See [SQL layout and imported provenance](sql-layout.md).

The prior automatic-adoption pilot is complete, with all twelve sessions
finished. Its explicit `AGENTS.md` load cue is conditional evidence from that
matched setup, not proof of automatic instruction discovery or a generally
necessary cue. See the [automatic-adoption report](../evaluation/automatic-adoption/REPORT.md)
for the observations and missing-data limits. The newer
[prompt-layer report](../evaluation/prompt-layers/REPORT.md) records eight completed
runs. Neither study establishes a minimum instruction, a general success rate,
universal adoption, savings, or a package effect.
