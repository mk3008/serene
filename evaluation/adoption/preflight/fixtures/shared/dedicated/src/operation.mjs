import { bind } from '@mk3008/serene';
import { findAccount } from './findAccount.mjs';

export function accountName(db, { tenantId, accountId }) {
  const q = bind(findAccount, { tenantId, accountId });
  return db.prepare(q.text).get(q.params)?.name ?? null;
}
export function canSpend(db, { tenantId, accountId, amount }) {
  if (!Number.isSafeInteger(amount) || amount <= 0) return false;
  const q = bind(findAccount, { tenantId, accountId });
  const account = db.prepare(q.text).get(q.params);
  return account !== undefined && account.balance >= amount;
}
