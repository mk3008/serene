# ORM examples as native-driver audit research

Serene remains raw SQL + native driver first. This branch studies one library at a
time. A library's popularity or compatibility gap is not a reason to add features.

For each phase, record the unchanged-runtime example, observed audit behavior,
minimal code needed to close each gap, and an independent natural native-driver
example. Adopt a product change only for demonstrated native-driver value, with
its own scope and negative tests; generic naming alone does not establish value.
Runtime compatibility, discovery, ordinary classification and review efficiency
are separate outcomes. Do not force ordinary classification or expand binding
correctness into the existing construction-provenance guarantee.

| Subject | Status |
| --- | --- |
| Kysely | [Investigated; Kysely-specific features rejected](kysely/REPORT.md). Native bounded follow-up completed; candidate recorded. |
| TypeORM | [Completed: no change needed](typeorm/REPORT.md) |
| Prisma 7 | [Completed: configuration only](prisma7/REPORT.md) |
| Sequelize | [Investigated: stopped at contract boundary](sequelize/REPORT.md) |
| Knex | Not started; paused after Sequelize finding |
| Prisma 8 / Drizzle fragment adaptation | Excluded from this research scope |

Per the latest PR review, advance sequentially without a human stop when no new
production adoption candidate or general improvement is found. Stop on a new
candidate, contract conflict, scope/prerequisite uncertainty, or design decision.
Record each library in its own commit. The known QueryConfig candidate remains
pending independently; production changes are outside this research PR. This phase changes research artifacts
only; production source, tooling, package dependencies and public promises remain
unchanged. The child package dependencies are isolated reproducibility tools.

## Native follow-up

[Bounded QueryConfig prototype and decision](native-query-config/REPORT.md):
25 before/after cases, pinned native TypeScript compatibility, and all 27 original
Kysely audit matrix cells asserted. Recommend the bounded native feature for a
separate production change; no product implementation. Remaining ORM phases follow the updated stop rules.

## Current stop

Sequelize bind processing rewrites a fixed SQL literal before the driver boundary.
The research pauses for the compatibility/security-contract decision documented
in its report, per PR comment 5594087865. No production correction is proposed.
