# SQL layout and imported provenance

Serene is layout-neutral. An authoritative SQL definition may live beside its
operation or in a dedicated module. Choose that layout for the application's
review and reuse needs; Serene does not require a particular file structure or
adoption of Raw SQL Rules.

The audit establishes provenance within each file. An imported `Sql` can work
correctly at runtime while its binding/execution remains `review-required` in the
static inventory. Selecting both files or the entire directory does not turn the
audit into a module resolver. An ordinary SQL tag in the definition file does not
by itself prove which exported value reached another file's execution site.

For construction review of such a path, locate the authoritative definition and
follow its export/import to the binding and driver call. Keep the unresolved path
in review until that connection is checked. Also retain the normal separate review
of SQL meaning, values and driver behavior. `review-required` describes unresolved
recognition, not a finding that the imported SQL is unsafe.

Do not duplicate the SQL, move it against the application's chosen layout, or add
an unsafe escape merely to make `--strict` pass. Strict mode deliberately fails on
unresolved paths; projects choosing those paths need a review workflow that handles
them explicitly. Serene does not automatically remember or approve that review.

The [bounded layout comparison](../evaluation/layout-ownership/REPORT.md) reproduced
this tradeoff on a single lookup and a definition shared by two operations. Both
layouts preserved SQL and native SQLite behavior. Colocation removed one explicit
file read on the measured route, while imports remained traceable and statically
unresolved. That is not a general layout ranking or measured AI-review saving.

Serene therefore retains file-local recognition and owns this explanation of its
coverage boundary. It does not currently add cross-file recognition or recommend
one layout over the other. A future bounded extension should demonstrate avoided
construction-review work on real imported paths and specify coherent module/source
identity and invalidation, with uncertain paths remaining nonordinary. The current
decision is independent of any external Rules project's policy.
