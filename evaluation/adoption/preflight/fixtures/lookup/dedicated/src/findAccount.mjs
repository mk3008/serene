import { sql } from '@mk3008/serene';
export const findAccount = sql`SELECT name, balance FROM accounts WHERE tenant_id = :tenantId AND id = :accountId`;
