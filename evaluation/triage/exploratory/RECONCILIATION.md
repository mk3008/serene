# Root reconciliation of independent scoring

The unedited [adjudication](adjudication.json) is retained. Its per-case judgments
identify all frozen gold defects and execution sites. Its hand-written summary
contains arithmetic errors: summing the twelve case records gives **12/12 gold
hits and 48/48 sites**, not 11/11 and 47/47. [aggregate.json](aggregate.json)
is computed from case records and is the report's source for totals.

There is a substantive disagreement on the four Birch status-validation findings.
The adjudicator calls these confirmed newly exposed defects because the contract
says present status is open/paid/void. Root considers that wording ambiguous between
a valid-input precondition and a handler validation requirement; invalid-input
behavior is not specified. The pre-freeze validator had accepted status handling.
Both interpretations remain on record. Do not expand frozen gold or use these
four findings as definitive false positives. Either interpretation affects every
arm equally on this task.

The adjudicator retains five other claims as contract ambiguity: missing-update
behavior, authenticated context shape, and numeric zero identifiers. Root agrees.
Thus nine additional claims are disputed or contract-dependent in root's report;
this differs from the adjudicator's five ambiguous plus four newly exposed labels.
No post-answer task or gold edits were made.

One definite erroneous subclaim was missed in adjudication: case09/v09 finding 1
says status=deleted can return deleted invoices. The query requires both
status != :deleted (deleted='deleted') and status = :status, so that claim is
contradicted by the conjunction. The broader validation finding remains disputed;
record one false subclaim rather than pretend the whole claim's status is settled.

case09/v09 is malformed JSON in the saved file and final response. Its text can
be read semantically, but the structured-output failure is retained. Semantic recall
and machine-readable gold delivery are distinct: C has 3/3 semantic gold hits but
only 1/3 gold hits delivered in valid JSON; the other two were in the invalid
answer. This one format failure is not evidence of a general treatment effect.

These disagreements expose limits of the pilot's contract and evaluator quality.
They do not justify choosing one interpretation to manufacture an audit benefit.
Root made deterministic count corrections and recorded interpretation differences
without spending on replacement reviewers or overwriting the original assessment.
