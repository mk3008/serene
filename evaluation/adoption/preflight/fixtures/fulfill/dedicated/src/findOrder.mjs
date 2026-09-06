import { sql } from '@mk3008/serene';
export const findOrder = sql`SELECT sku, quantity FROM orders WHERE tenant_id = :tenantId AND id = :orderId AND status = 'pending'`;
