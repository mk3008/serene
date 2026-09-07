# Construction diff boundary (Issue #5)

Implementation checkpoint: add `filterConstructionDiff` to the optional `/filter`
entry. The host supplies pinned/current full base and head sources plus an ordered,
complete list of paired UTF-16 edit ranges. This is a structured change response,
not a parser for unified patch syntax or a Git client. Every supplied edit remains
one output record with explicit base/head identity and offsets.

Compress only changes contained in corresponding construction-only functions
that are positively ordinary on both sides. Classification changes, unmatched
functions, additions/deletions of whole functions, mixed regions and uncertainty
remain source-visible. Compare both complete files, including unchanged execution
sites whose provenance may be affected by import changes. Check unchanged gaps as
well as changed text so an omitted edit cannot silently grant compression.

Before completion, deterministic regression tests must cover changed-region
preservation, eligible compression, exact actionable source, transitions, empty
sides, stale/mismatched context, determinism and follow-up source filtering.
No AI participants are planned unless these checks leave a concrete behavior
question. This checkpoint is incomplete until the implementation and gate land.
