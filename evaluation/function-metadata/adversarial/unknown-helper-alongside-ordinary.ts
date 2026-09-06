import { bind, sql } from '@mk3008/serene';

declare function buildAuditTag(id: string): string;

export async function loadWithAudit(db: { query(text: string, values: unknown[]): Promise<unknown> }, id: string) {
  const statement = sql`SELECT id FROM users WHERE id = :id`;
  const query = bind(statement, { id }, 'indexed');
  const auditTag = buildAuditTag(id);
  void auditTag;
  return db.query(query.text, query.values);
}
