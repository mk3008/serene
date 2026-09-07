# AI adoption guide

Serene is an optional repository convention for teams whose AI agents work on
raw SQL. Install the package and keep its local README and documentation
readable to the agent. The package adds a recognizable construction boundary;
the native SQL text and the native driver remain the application’s
responsibility. Serene does not replace review of SQL meaning, value-to-driver
binding, authorization, or business behavior.

If the repository wants a default for construction and review work, add this
short instruction to its root `AGENTS.md` (or to the repository’s equivalent
instruction file):

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
audited, or classified. Agents should use the installed package and inspect the
local documentation when the task calls for it. A Serene audit is an inventory
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

The automatic-adoption pilot is complete, with all twelve sessions finished.
See the [automatic-adoption report](../evaluation/automatic-adoption/REPORT.md)
for the observations and missing-data limits.
This small matched-task observation does not prove a minimum instruction, a
general success rate, universal adoption, savings, or a package effect.
