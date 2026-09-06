import { sql } from '@mk3008/serene';
export const reserve = sql`UPDATE inventory SET stock = stock - :quantity WHERE tenant_id = :tenantId AND sku = :sku AND stock >= :quantity RETURNING stock`;
