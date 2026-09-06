# Review triage evaluation plan — frozen before corpus execution

Baseline: `6ebce0d064dbee21caf53ce1f1f3441259cfffa2`.
Purpose: test whether review triage has a concrete benefit, find counterexamples,
and improve only demonstrated low-cost discovery gaps. Do not manufacture evidence
that Serene is useful or confuse a tool result with AI defect discovery.

## Phase 1: deterministic coverage study (executed in this PR)

Construct a labeled challenge corpus before running it. Cover normal screened SQL,
raw safe SQL, unsafe construction, sink aliases, computed calls, wrappers, imported
SQL, non-SQL lookalikes, binding misuse and database-side dynamic SQL. Each case
identifies the actual execution line, whether it is a SQL sink, construction concern,
and an explanation. Keep genuine SQL defects separate from construction provenance.
Use synthetic author-labeled cases: this is a challenge set, not a representative
sample or an independent holdout.

Compare a frozen line-oriented grep-like baseline with the baseline audit, then the
same corpus with the final audit. Count sink discovery, unseen sinks, nonordinary
construction referrals, construction concerns incorrectly labeled ordinary,
ordinary construction reductions, and non-SQL false candidates separately. Measure
at the known call site, never count an unrelated tag declaration as sink discovery.
Do not attach statistical significance to these deterministic fixture counts.
Record raw findings and hashes. Freeze corpus and initial results before fixes.

Candidate improvement: bounded local sink alias recognition only if missed calls
are reproduced. Retain conservative uncertainty, no project-wide dataflow, no
runtime/API expansion. Any new case added after results is labeled a regression,
not a held-out evaluation. Do not change expected labels to match output.

## Phase 2: AI review difference (conditional on independent execution capability)

The author of source/labels must not act as a supposedly blinded reviewer. First
check for a supported independent model execution surface. If none is available,
mark AI runs **not run**, publish an execution-ready protocol, and still finish
Phase 1, documentation and the PR. No paid API signup or credential workaround.
No synthetic AI answers, no inference of statistical significance from static recall.
A credible AI study needs the same defects retained across arms, fixed model/budget,
independent sessions, blinded labels and adjudication. Split representation benefit
from audit assistance; do not compare buggy raw SQL to a repaired Serene variant.

## Completion

Commit/push the plan, then the frozen corpus and baseline evidence, then fixes and
final evidence. Run relevant regression tests and package verification for tooling
changes. Document what can be found, only referred, or remains undiscovered. Open a
PR against main; do not merge or publish. Preserve negative results and remaining
limitations. Runtime dependency-free/native driver boundaries remain unchanged.

## Execution capability check

`command -v codex` returned no executable in the task environment. Available tools
were inspected: no standalone model-inference/evaluation endpoint is exposed.
The current author session has already seen the implementation and oracle and is
not an independent blinded reviewer. AI effectiveness remains unmeasured here.
