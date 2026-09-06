# SQL-safety investigation prioritization

Status: candidate protocol, NOT RUN, no scored packets frozen. This replaces the
mixed general-defect study as the next Serene evaluation. See the
[research map](../README.md) for separate adoption, layout and semantic-review work.

## Question and scope

Does a file-local Serene inventory help a reviewer prioritize SQL execution paths
that need extra construction/provenance investigation, compared with a cheap grep
inventory, while missing fewer concerns or spending less effort on resolved paths?

The target is control over SQL syntax and evidence of construction provenance.
Tenant predicates, business-value selection, result meaning and authorization are
outside the primary outcome. An ordinary construction boundary still needs those
ordinary application reviews; skipping extra SQL-construction investigation does
not mean skipping all review. Semantic findings may be retained in a separate
appendix, never credited or penalized in the safety-triage score.

## Compare assistance on identical source

Use two arms: G receives a fixed grep candidate inventory; S receives full Serene
audit output. Give both identical source, driver contract, narrow Serene contract,
source access tools and review budget. This comparison isolates audit assistance;
there is no raw-to-Serene conversion and no instruction or layout treatment.
Keep layout constant within every task pair. Dedicated-versus-colocated and strict
blocking belong to the separate Rules integration study, not these arms.

Inventories must not define the truth set or disclose expected concern counts.
Independently enumerate execution sites, including sites missed by both tools and
non-SQL lookalikes. Preserve the tool's classifications without treating them as
oracle labels: violation is a construction-contract flag, not proof of exploitability;
review-required is uncertainty, not a confirmed vulnerability.

## Task and oracle preparation

Start with a small independently authored set of application-sized packets with
multiple execution sites and substantial surrounding code. Include fixed/native
bound SQL, finite reviewed syntax choices, runtime arbitrary-syntax paths, and
provenance that actually needs tracing. Include an audit-ordinary counterexample
if independently reproducible; never invent a false negative just to fill a quota.
Source layout and driver behavior are fixed and explicit within each pair.

For each true execution site, freeze separately:
- Construction facts: fixed syntax/finite choices, untrusted syntax influence, or
  insufficient evidence. Record whether external implementation evidence is absent.
- Initial need for extra investigation under the supplied repository/driver contract,
  the evidence needed to resolve it, and the justified final disposition. A real
  unresolved path may correctly remain unresolved; no forced safe/unsafe answer.
- Exact source locations and code-level witnesses. Where practical, use an executable
  SQL/argument capture or native-driver witness to verify syntax/value separation.
  State which evidence is a mock and which actually executes the DB.

An initial referral that resolves to safe can still be justified. Count it separately
from unnecessary deep investigation of an already established fixed/bound path.
Do not derive these labels from audit output or equate every imported definition
with danger. Hold import-only layout-friction specimens in the layout track; do not
use their prevalence to drive the primary triage score.

Before scoring, a separate validator must reproduce the construction facts, driver
behavior, sink inventory and oracle criteria. Resolve ambiguous input domains and
public-wrapper behavior before freeze. Do not use general business defects to make
the tasks harder. Use an unrelated calibration packet to set a feasible investigation
budget; record calibration as development, not scored reviewer evidence.

## Review workflow and budget

Use a neutral request to identify and rank paths needing extra SQL-construction
investigation, give source evidence, then spend a fixed budget on selected paths.
Reviewers may inspect the repository to discover omitted sites; merely repeating
an inventory is not correct diagnosis. Save the initial ranked referral list before
deep investigation, and save each subsequent inspection action and final disposition.

Provide the same bounded source-reader interface to both arms so actual file/range
reads and targeted deep investigations can be counted. Do not infer effort savings
from a self-reported inspected-site list or aggregate Work wall time. The packet
must be large enough, and the calibrated budget small enough, that investigating
all sites deeply is not the default workflow. Never truncate one arm's inventory
without recording a treatment-delivery failure.

Before dispatch, freeze packet/oracle hashes, exact grep expression and audit
version, prompts, actual reader/logging mechanism, number of tasks, rank cutoff K,
inspection budget, timeout/output limits, random seed and failure policy. Choose
those constants using calibration before seeing scored answers. No scored run is
authorized by this document alone until that concrete freeze is complete.

Use fresh sessions with explicit Luna/medium requests; Terra/medium is available
for warranted preparation checks or a separately frozen cohort. Keep participant
settings constant within the comparison. Preserve requested versus served metadata
limits, instruction-scoped filesystem isolation and unavailable token usage. No
silent retries, model replacements, or post-answer oracle changes.

## Separate outcomes, without a composite score

| Outcome | Definition |
| --- | --- |
| Initial prioritization | Recall at frozen K over oracle-required investigation sites; precision of referrals at the same cutoff |
| Missed construction concerns | Required sites not selected or incorrectly dismissed, including sites absent from inventories |
| Unnecessary deep review | Deep investigations of paths whose supplied evidence already establishes fixed/finite syntax and separate values; denominator is those resolved paths |
| Justified uncertainty | Required provenance investigations correctly selected, resolved with evidence or explicitly left unresolved |
| Diagnostic follow-through | Correct mechanism/disposition after investigation; generic tool labels alone receive no diagnosis credit |
| Investigation effort | Actual logged reads, ranges/bytes and deep-investigation actions at matched budget; tokens/time only where reliably measured |
| Tool coverage | Missed true execution sites and non-SQL candidates, reported separately from reviewer decisions |
| Delivery reliability | Format failures, output visibility/truncation, missing logs and timeouts, separate from semantic safety outcomes |

Report paired task outcomes; sites inside a task are not independent experimental
trials. Break audit-ordinary, review-required and violation paths out descriptively
against the independent oracle, including missed concerns in any category. Do not
reward ignoring a false-ordinary unsafe path just because the tool said ordinary.

A practical benefit requires fewer unnecessary investigations at preserved required-
path coverage, or better coverage at matched effort. Freeze practical tolerances
before scored answers; do not choose the most favorable metric after the fact.
A ceiling, regression or null outcome is retained. Do not infer usefulness or
uselessness from semantic bug recall, strict exits, or JSON validity alone.

## Completion boundary

Produce a reviewable packet/budget/oracle freeze and its validation evidence before
new scored runs. Preserve the old mixed pilot as historical evidence of what it
actually measured. No runtime improvements, Rules changes, broader layout experiment
or paid-service provisioning are included in this scope correction.
