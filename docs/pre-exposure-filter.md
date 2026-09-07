# Filter source before AI delivery

For search/read responses, `@mk3008/serene/filter` exports
`filterConstructionSource(snapshot, response)`. Use it between a source-bearing
tool operation and model delivery in a **SQL-construction review** workflow.
It uses the optional TypeScript dependency, like `@mk3008/serene/audit`.

For PR/commit changes, use the small paired-source companion
[`filterConstructionDiff`](diff-filter.md) from the same entry. Filtering the two
sides independently cannot establish transition safety.

The host chooses files, searches and reads. Serene receives a full file context
and the exact ranges the host was about to deliver; it does not search the
repository, read Git or execute SQL.

```ts
import { filterConstructionSource, type SourceSnapshot } from '@mk3008/serene/filter';

// Both contexts come from the host, not the reviewing model.
// current must be the coherent source/revision used by this read operation.
function deliverRead(pinned: SourceSnapshot, current: SourceSnapshot,
  start = 0, end = current.source.length) {
  const ranges = [{ start, end, text: current.source.slice(start, end) }];
  return filterConstructionSource(pinned, { ...current, ranges });
}

// Return only deliverRead(...) to the model, never the original source envelope.
```

Search uses the same API with one range per source match. Keep a contiguous read
as one range. Offsets are zero-based, half-open **UTF-16 string offsets**, not
UTF-8 byte offsets or display columns. Text must be the exact source substring,
without line-number prefixes, highlighting, truncation or newline normalization.

## Result and freshness

- `filtered: true`: each requested range has ordered `parts`. A `source` part
  carries unchanged text and offsets. An `ordinary` part carries file, revision,
  complete function offsets, authoritative `function` name and one-based execution
  `sites` (line/column). It contains no hidden SQL or binding source. A partial
  match gets the whole function's marker; outer offsets retain the requested range.
- `filtered: false`: `ranges` retains supplied text; `reason` explains why no
  suppression occurred. Revision/file/full-source mismatch, incorrect range text
  or offsets, unsupported files and parse/analysis failures preserve source. One
  mismatched range disables filtering of the entire response.
- Input order, duplicate and overlapping ranges are preserved. Repeated calls
  produce equal results. No shared cache or marker deduplication is maintained.

Both full-source contexts must match, including text outside requested ranges.
File names and revision identifiers are compared exactly. The host must obtain a
coherent current context for each operation; passing an old snapshot twice cannot
establish freshness. This API does not attest to Git state or authenticate host
metadata. Structurally malformed arguments throw `TypeError`; on integration
errors the host must retain and deliver its original source response, never
turn an error into an ordinary marker.

## Compression boundary

Only named top-level functions consisting of ordinary Serene construction/binding
and simple ordinary candidate-driver calls are eligible. At least one execution
is required. The filter uses the production audit and further restricts surrounding
syntax; the audit's candidate-name heuristic still does not prove driver identity.

Mixed bodies, control flow, defaults, destructuring, nested functions, unknown
helpers/sinks, independent expressions in driver arguments and uncertain
provenance stay visible. Same-line neighbors remain exact. TS/JS source extensions
are supported; SQL grammar and cross-file provenance are not interpreted. There
is no caller-supplied findings input or force-ordinary option.

Apply this boundary to **every source-bearing primitive before delivery** in the
specialized workflow. A later filter after an unfiltered read, or a raw shell/read
bypass, does not implement pre-exposure filtering. This is a library boundary,
not an installed host adapter or sandbox.

General, authorization, SQL-meaning and driver-binding reviews need original
source. Ordinary must not discharge those reviews; retain an unfiltered path for
them. Small snippets or repeated markers can exceed original response size; no
universal token or cost saving is promised. See [validation](pre-exposure-filter-validation.md)
and [audit coverage](review-coverage.md).
