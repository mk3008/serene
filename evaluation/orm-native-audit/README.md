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
| Kysely | [Investigated; Kysely-specific features rejected](kysely/REPORT.md). Native bounded follow-up completed; stop for review. |
| TypeORM | Not started; later direct-call control |
| Prisma 7 | Not started; later configurable sink / variadic arguments |
| Sequelize | Not started; later options-object binding |
| Knex | Not started; optional later object construction/execution study |
| Prisma 8 / Drizzle fragment adaptation | Excluded from this research scope |

No automatic advance to another library. This phase changes research artifacts
only; production source, tooling, package dependencies and public promises remain
unchanged. The child package dependencies are isolated reproducibility tools.

## Native follow-up

[Bounded QueryConfig prototype and decision](native-query-config/REPORT.md):
25 before/after cases, pinned native TypeScript compatibility, and all 27 original
Kysely audit matrix cells asserted. Recommend the bounded native feature for a
separate production change; no product implementation or next ORM phase yet.
