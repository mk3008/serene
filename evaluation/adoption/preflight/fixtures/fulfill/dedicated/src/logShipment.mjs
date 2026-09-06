import { sql } from '@mk3008/serene';
export const logShipment = sql`INSERT INTO shipments (tenant_id, order_id, sku, quantity) VALUES (:tenantId, :orderId, :sku, :quantity) RETURNING id`;
