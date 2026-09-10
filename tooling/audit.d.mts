export interface ReviewSignal {
  code: string;
  /** Approximate SQL-content review suggestion, not a validation result. */
  detail: string;
}
export interface Finding {
  file: string;
  line: number;
  column: number;
  boundary: 'source' | 'serene' | 'driver-candidate' | 'computed-call';
  /** Lexical function name when source syntax supplies one confidently; otherwise null. */
  function: string | null;
  /** Content axis; absence means no heuristic matched, not approval of SQL logic. */
  reviewSignals?: ReviewSignal[];
  /** Construction/provenance axis, independent of content review suggestions. */
  level: 'ordinary' | 'review-required' | 'violation';
  code: string;
  detail: string;
}
export function auditSource(source: string, filename?: string, options?: { sinkNames?: readonly string[] }): Finding[];
