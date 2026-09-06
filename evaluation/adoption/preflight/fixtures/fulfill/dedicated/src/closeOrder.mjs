import { sql } from '@mk3008/serene';
export const closeOrder = sql`UPDATE orders SET status = 'shipped' WHERE tenant_id = :tenantId AND id = :orderId AND status = 'pending'`;
