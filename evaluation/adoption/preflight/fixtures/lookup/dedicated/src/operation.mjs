import { bind } from '@mk3008/serene';
import { findAccount } from './findAccount.mjs';

export function lookup(db, { tenantId, accountId }) {
  const q = bind(findAccount, { tenantId, accountId });
  return db.prepare(q.text).get(q.params) ?? null;
}
