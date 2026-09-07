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

export interface DiffSnapshot {
  readonly base: SourceSnapshot;
  readonly head: SourceSnapshot;
}

/** Complete ordered edits: text between paired ranges must be identical on both sides. */
export interface DiffResponse extends DiffSnapshot {
  readonly changes: readonly { readonly base: SourceRange; readonly head: SourceRange }[];
}

export interface SourceChange {
  /** Zero-based input record index. No record is dropped or combined. */
  readonly index: number;
  readonly kind: 'source';
  readonly base: SourceRange;
  readonly head: SourceRange;
}

export interface OrdinaryChange {
  readonly index: number;
  readonly kind: 'ordinary';
  readonly scope: 'sql-construction';
  readonly change: 'addition' | 'deletion' | 'modification';
  /** Changed offsets plus full corresponding function navigation on each side. */
  readonly base: { readonly start: number; readonly end: number; readonly function: OrdinaryPart };
  readonly head: { readonly start: number; readonly end: number; readonly function: OrdinaryPart };
}

interface DiffIdentity {
  readonly base: { readonly file: string; readonly revision: string };
  readonly head: { readonly file: string; readonly revision: string };
}

export type DiffFilterResult = DiffIdentity & (
  | { readonly filtered: false;
      readonly reason: 'snapshot-mismatch' | 'file-identity-change' | 'unsupported-file' |
        'range-mismatch' | 'diff-mismatch' | 'analysis-failed' | 'parse-failed' |
        'ambiguous-functions' | 'ordinary-set-changed' | 'no-ordinary-change';
      readonly changes: readonly SourceChange[];
      /** Side-specific loss/gain of ordinary recognition, including unchanged execution sites.
       * Not a full classification inventory or a semantic identity match. */
      readonly transitions?: { readonly base: readonly OrdinaryPart[]; readonly head: readonly OrdinaryPart[] } }
  | { readonly filtered: true; readonly changes: readonly (SourceChange | OrdinaryChange)[] }
);

/**
 * Construction-only diff boundary. Host owns patch decoding, edit completeness,
 * coherent base/head snapshots and source interception. Renames, unsupported or
 * incoherent responses retain supplied changes; malformed envelopes throw TypeError.
 * This does not authenticate revisions, generate diffs or render unified patches.
 */
export function filterConstructionDiff(snapshot: DiffSnapshot, response: DiffResponse): DiffFilterResult;
