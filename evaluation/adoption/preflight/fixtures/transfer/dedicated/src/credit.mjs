import { sql } from '@mk3008/serene';
export const credit = sql`UPDATE accounts SET balance = balance + :amount WHERE tenant_id = :tenantId AND id = :toId RETURNING balance`;
