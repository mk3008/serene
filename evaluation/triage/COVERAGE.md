# Detection and review coverage matrix

Frozen author-labeled synthetic cases; not AI review outcomes. `unseen` means no candidate finding at the actual execution line. A declaration elsewhere is not credited as discovery of that call.

| Case | Group | SQL sink | Construction concern | Grep call | Grep SQL | Initial audit | Final audit | Oracle / limitation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S01 | screened | True | False | review-required | unseen | ordinary | ordinary | screened |
| S02 | screened | True | False | review-required | unseen | ordinary | ordinary | screened |
| S03 | screened | True | False | review-required | unseen | ordinary | ordinary | screened |
| S04 | screened | True | False | review-required | unseen | ordinary | ordinary | screened |
| S05 | screened | True | False | review-required | unseen | ordinary | ordinary | screened |
| S06 | screened | True | False | review-required | unseen | ordinary | ordinary | screened |
| R01 | raw-safe | True | False | review-required | review-required | review-required | review-required | raw-safe |
| R02 | raw-safe | True | False | review-required | unseen | review-required | review-required | raw-safe |
| R03 | raw-safe | True | False | review-required | review-required | review-required | review-required | raw-safe |
| R04 | raw-safe | True | False | review-required | review-required | violation | violation | Finite raw concatenation: construction is constrained, but policy violation is not a vulnerability. |
| D01 | direct-risk | True | True | review-required | review-required | violation | violation | direct-risk |
| D02 | direct-risk | True | True | review-required | review-required | violation | violation | direct-risk |
| D03 | direct-risk | True | True | review-required | unseen | violation | violation | direct-risk |
| D04 | direct-risk | True | True | review-required | unseen | violation | violation | direct-risk |
| D05 | direct-risk | True | True | review-required | unseen | review-required | review-required | Mutable construction remains review-required without whole-program tracing. |
| D06 | direct-risk | True | True | review-required | unseen | violation | violation | Serene runtime rejects this path: construction-policy misuse, not a successfully executing SQL injection. |
| D07 | direct-risk | True | True | review-required | unseen | violation | violation | Fabricated frozen template can admit runtime SQL; source must refer it. |
| A01 | alias | True | True | unseen | review-required | unseen | violation | Assume the driver method is callable when detached; alias must not disappear. |
| A02 | alias | True | True | unseen | review-required | unseen | violation | alias |
| A03 | alias | True | True | unseen | review-required | unseen | violation | alias |
| A04 | alias | True | True | unseen | review-required | unseen | violation | alias |
| A05 | alias | True | True | unseen | unseen | unseen | review-required | Prebound SQL is not the invocation first argument. Never infer ordinary from later arguments. |
| A06 | alias | True | True | unseen | unseen | unseen | unseen | External wrapper unresolved without configuration or cross-file analysis. |
| A07 | alias | True | True | unseen | unseen | unseen | unseen | Mutable callable aliases deliberately remain untraced. |
| C01 | computed | True | True | unseen | unseen | review-required | review-required | computed |
| C02 | wrapper | True | True | unseen | unseen | unseen | unseen | wrapper |
| C03 | configured-wrapper | True | True | unseen | unseen | review-required | review-required | configured-wrapper |
| C04 | cross-file | True | True | review-required | unseen | review-required | review-required | Unknown imported text must be reviewed; no proof of defect from this file alone. |
| C05 | multiline | True | True | unseen | unseen | review-required | review-required | multiline |
| C06 | namespace | True | False | review-required | unseen | review-required | review-required | Safe runtime, namespace provenance deliberately unresolved by audit. |
| L01 | outside-construction | True | False | review-required | unseen | ordinary | ordinary | Wrong values at execution: ordinary construction does not prove correct pairing. |
| L02 | outside-construction | True | False | review-required | unseen | ordinary | ordinary | Fixture assumes tenant filtering required. Business authorization defect is outside construction triage. |
| L03 | outside-construction | True | False | review-required | unseen | ordinary | ordinary | Database-side execution of a bound SQL string: second-order injection not screened. |
| N01 | non-sql | False | False | review-required | unseen | review-required | review-required | non-sql |
| N02 | non-sql | False | False | review-required | unseen | review-required | review-required | non-sql |
| N03 | non-sql | False | False | unseen | unseen | review-required | review-required | non-sql |
| N04 | non-sql | False | False | review-required | review-required | unseen | unseen | non-sql |
| N05 | non-sql | False | False | review-required | review-required | unseen | unseen | non-sql |
| N06 | non-sql | False | False | unseen | unseen | unseen | review-required | non-sql |
| N07 | non-sql | False | False | unseen | unseen | unseen | unseen | non-sql |

Remaining unseen SQL sinks: A06 (imported wrapper), A07 (mutable renamed callable), C02 (unconfigured custom execution API). C03 shows the explicitly configured counterpart of C02.

L01–L03 intentionally remain ordinary *construction*, despite oracle defects in value pairing, tenant authorization, or database-side dynamic execution. These are not missing construction warnings, but they are defects a code reviewer must still find.

R04 is a constrained finite raw concatenation that is a Serene policy violation without being an injection vulnerability. Non-SQL false candidates N01/N02/N03/N06 remain review work; no driver identity is proved.

Sources and labels: [corpus.json](corpus.json). Complete diagnostics: [final-results.json](final-results.json).
