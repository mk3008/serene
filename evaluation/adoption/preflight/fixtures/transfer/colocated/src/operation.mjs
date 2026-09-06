import { bind, sql } from '@mk3008/serene';
import { transaction } from '../../../../support.mjs';
const debit = sql`UPDATE accounts SET balance = balance - :amount WHERE tenant_id = :tenantId AND id = :fromId AND balance >= :amount RETURNING balance`;
const credit = sql`UPDATE accounts SET balance = balance + :amount WHERE tenant_id = :tenantId AND id = :toId RETURNING balance`;

export function transfer(db, { tenantId, fromId, toId, amount }) {
  if (!Number.isSafeInteger(amount) || amount <= 0 || fromId === toId) throw new Error('Invalid transfer');
  return transaction(db, () => {
    const out = bind(debit, { tenantId, fromId, amount });
    const source = db.prepare(out.text).get(out.params);
    if (!source) throw new Error('Debit rejected');
    const into = bind(credit, { tenantId, toId, amount });
    const target = db.prepare(into.text).get(into.params);
    if (!target) throw new Error('Credit rejected');
    return { fromBalance: source.balance, toBalance: target.balance };
  });
}
