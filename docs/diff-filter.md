# Filter construction diffs before AI delivery

`filterConstructionDiff(snapshot, response)` is a small companion to the source
filter, exported from `@mk3008/serene/filter`. It compares both complete file
versions before omitting changed ordinary construction source. Calling the source
filter independently on removed and added lines cannot establish transition safety.

Use this only for **SQL-construction review**. It does not review SQL meaning,
authorization, driver binding, general code changes or business behavior.

## Host boundary

The host owns Git/PR acquisition and conversion into an ordered, complete edit list
for **one file pair**. Each record pairs a base range and a head range:

```ts
import { filterConstructionDiff } from '@mk3008/serene/filter';

// Each pair has base/head: { file, revision, source }.
// Every range has { start, end, text } in its own full source.
const result = filterConstructionDiff(pinnedPair, {
  ...currentPair,
  changes: pairedEdits,
});
```

Offsets are zero-based, half-open UTF-16 positions, not bytes or patch line numbers.
Both full sources and nonempty opaque revisions are mandatory, including the empty
source on an absent side of a file addition/deletion. `base` means the actual left
side used to generate the diff (for a three-dot Git comparison, the resolved merge
base); `head` means the right side. Names alone do not establish revision identity.
The same file/revision cannot identify different source text.

Every changed interval must appear, in source order on both sides. Unchanged gaps
before, between and after records must be identical. Each range text must exactly
match its side's source. An empty range represents no removed/added text on that
side. Records may include surrounding context, but a record crossing a function
boundary stays visible rather than being split by Serene. No-op/context-only
records are retained as source. Zero-context edit ranges usually give the smallest
usable input. The host can retain its hunk IDs using the unchanged input index.

This is not a unified-patch parser or diff engine. The host decodes the exact patch,
including newline and encoding conventions, and converts hunk coordinates. Supplied
range text plus equal gaps prove that the edits describe the two supplied sources;
they do not authenticate an external Git patch's headers, mode changes or hunk
layout. Renames, binary changes, file modes and combined/merge diffs require the
host's ordinary unfiltered path. Different base/head file identities are explicitly
returned unfiltered. Do not silently omit those change types from a PR review.

## Output and compression rule

Every input record produces exactly one output record at the same `index`. The
output also carries both file/revision identities. A `kind: 'source'` record retains
both original ranges and exact text, including empty sides. A `kind: 'ordinary'`
record omits both texts and contains:

- `scope: 'sql-construction'` and explicit `change` (addition, deletion, modification);
- separate base/head changed offsets;
- each side's full function navigation in `base.function` / `head.function`, using
  the same metadata as the source filter: name, span, execution coordinates and revision.

An ordinary marker means **a change exists and construction provenance remains
ordinary on both sides**. It must be rendered as a changed region, never a zero-hit
or no-change response. It makes no claim that the SQL or behavior is equivalent.
Retain the original patch for other review scopes.

The shared production recognizer only accepts named, top-level construction-only
functions. Both sides must recognize the same unique function names; every edit
that touches a candidate pair must stay entirely inside the corresponding spans.
Applying those edits to the full base function must reproduce the full head
function. A coarse hunk containing mixed or neighboring source stays whole.

Whole-function/file additions and deletions, renamed functions and duplicate
ordinary names stay visible. Insertions and deletions **inside** corresponding
ordinary functions can compress, retaining their distinct empty side. Unknown,
raw, mixed and violation paths are never independently promoted to ordinary.

## Transitions and unchanged execution sites

Both complete files are classified, not just changed lines. If an ordinary function
name is lost or gained, **all edits in that file pair remain source-visible** with
reason `ordinary-set-changed`. Side-specific `transitions.base` and
`transitions.head` provide authoritative navigation for lost/gained recognition.
This is a conservative set difference, not a semantic function identity match or a
complete audit inventory. Even a harmless new ordinary function disables compression
elsewhere in that file pair; no configuration or matching framework is introduced.

For example, changing a Serene import to an unknown module can invalidate an
otherwise unchanged execution site. The import edit stays visible and the old
ordinary function is explicitly listed for follow-up. Base navigation is only valid
in the base snapshot; do not use its offsets as head offsets. Search by name in the
head through the existing source boundary when needed. Ordinary-to-nonordinary and
reverse transitions are not compressed into harmless-looking ordinary markers.
Changes that keep recognized construction ordinary can omit source, even if SQL
meaning, values or driver pairing change: those are separate review scopes.

## Failure and follow-up

Snapshot mismatch, unsupported files, invalid ranges, incomplete/out-of-order edits,
parse/analysis failure or ambiguous functions return supplied edits without source
omission and an explicit reason. A missing edit cannot be recovered from the supplied
patch records: `diff-mismatch` means **incoherent input**, not no change. The host must
retain the original response and reacquire coherent context/complete edits before
claiming coverage. `filtered: false` alone does not mean a review passed.

Malformed envelopes throw `TypeError`; preserve the host's original response on
integration errors. Revisions and current source are host assertions, not authenticated
Git freshness. Never replace the independent current-source check with the pinned
source merely to pass this boundary.

Subsequent reads/searches use `filterConstructionSource` with the corresponding
side's pinned/current full source. No bypass is needed for construction review;
unsupported or newly nonordinary functions remain visible there. The host must
intercept every relevant source-bearing response before AI delivery. Serene does
not install an adapter or prevent out-of-host access.

See [deterministic validation](diff-filter-validation.md). This checkpoint completes
the small production boundary requested by Issue #5; host integrations remain optional.

Content [review suggestions](sql-content-review.md) also prevent suppression, even
when construction remains ordinary. Eligibility transitions retain source and
follow-up navigation under the existing diff contract.
