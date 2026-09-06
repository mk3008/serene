import { sql } from '@mk3008/serene';
export const debit = sql`UPDATE accounts SET balance = balance - :amount WHERE tenant_id = :tenantId AND id = :fromId AND balance >= :amount RETURNING balance`;
