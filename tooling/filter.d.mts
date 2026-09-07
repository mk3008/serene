/** Host-owned full file at an opaque revision. File identity is an exact string. */
export interface SourceSnapshot {
  readonly file: string;
  readonly revision: string;
  readonly source: string;
}

/** Zero-based, half-open UTF-16 offsets into the full source; text must match exactly. */
export interface SourceRange {
  readonly start: number;
  readonly end: number;
  readonly text: string;
}

export interface SourceResponse extends SourceSnapshot {
  readonly ranges: readonly SourceRange[];
}

export interface SourcePart extends SourceRange {
  readonly kind: 'source';
}

export interface OrdinaryPart {
  readonly kind: 'ordinary';
  readonly scope: 'sql-construction';
  readonly file: string;
  readonly revision: string;
  /** The complete recognized function span, not just its overlap with the requested range. */
  readonly start: number;
  readonly end: number;
  /** Authoritative audit navigation metadata; never SQL or authorization assurance. */
  readonly function: string | null;
  /** One-based execution coordinates, all inside the named function. */
  readonly sites: readonly { readonly line: number; readonly column: number }[];
}

export type FilterResult =
  | { readonly filtered: false;
      readonly reason: 'snapshot-mismatch' | 'unsupported-file' | 'range-mismatch' |
        'analysis-failed' | 'parse-failed' | 'no-ordinary-range';
      readonly ranges: readonly SourceRange[] }
  | { readonly filtered: true;
      readonly ranges: readonly { readonly start: number; readonly end: number;
        readonly parts: readonly (SourcePart | OrdinaryPart)[] }[] };

/**
 * Construction-only review boundary. Does not discover files, read Git, or validate
 * host revision claims. Unsupported/stale content stays visible. Structurally invalid
 * arguments throw TypeError; the host must preserve its original response on error.
 */
export function filterConstructionSource(snapshot: SourceSnapshot, response: SourceResponse): FilterResult;
