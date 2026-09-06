import { bind, sql } from '@mk3008/serene';
const findAccount = sql`SELECT name, balance FROM accounts WHERE tenant_id = :tenantId AND id = :accountId`;

export function lookup(db, { tenantId, accountId }) {
  const q = bind(findAccount, { tenantId, accountId });
  return db.prepare(q.text).get(q.params) ?? null;
}
