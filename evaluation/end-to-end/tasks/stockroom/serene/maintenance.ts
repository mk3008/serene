import { bind, sql } from '@mk3008/serene';

import type { Db, UntrustedInput } from './contracts.js';

export async function receiveShipment(db: Db, quantity: string, sku: string): Promise<void> {
  const q = bind(sql`
    UPDATE stock_items
    SET on_hand = on_hand + :quantity
    WHERE sku = :sku
    RETURNING on_hand
  `, { quantity: quantity, sku: sku });
  await db.execute(q.text, q.params);
}

export async function purgeStockroomPreview(db: Db): Promise<void> {
  await db.execute(`
    DELETE FROM stock_items_preview
    WHERE expires_at < CURRENT_TIMESTAMP
    RETURNING id
  `);
}

export async function sendStockroomSnapshot(db: Db): Promise<void> {
  await db.sendSql(`
    SELECT id, created_at
    FROM stock_items
    WHERE archived = false
  `);
}
