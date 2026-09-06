export interface Finding {
  file: string;
  line: number;
  column: number;
  boundary: 'source' | 'serene' | 'driver-candidate' | 'computed-call';
  /** Lexical function name when source syntax supplies one confidently; otherwise null. */
  function: string | null;
  level: 'ordinary' | 'review-required' | 'violation';
  code: string;
  detail: string;
}
export function auditSource(source: string, filename?: string, options?: { sinkNames?: readonly string[] }): Finding[];
