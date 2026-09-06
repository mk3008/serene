import { bind, sql } from '@mk3008/serene';

import type { Db, UntrustedInput } from './contracts.js';

export async function listReorderItems(db: Db): Promise<void> {
  const q = bind(sql`
    SELECT sku, item_name, on_hand
    FROM stock_items
    WHERE on_hand <= reorder_point
    ORDER BY sku
  `, {  });
  await db.query(q.text, q.params);
}

export async function findBinBalance(db: Db, binCode: string): Promise<void> {
  const q = bind(sql`
    SELECT bin_code, sku, quantity
    FROM bin_balances
    WHERE bin_code = :binCode
    ORDER BY sku
  `, { binCode: binCode });
  await db.query(q.text, q.params);
}

export async function reserveStock(db: Db, quantity: string, sku: string): Promise<void> {
  const q = bind(sql`
    UPDATE stock_items
    SET reserved = reserved + :quantity
    WHERE sku = :sku
    RETURNING sku
  `, { quantity: quantity, sku: sku });
  await db.execute(q.text, q.params);
}

export async function releaseReservation(db: Db, quantity: string, sku: string): Promise<void> {
  const q = bind(sql`
    UPDATE stock_items
    SET reserved = reserved - :quantity
    WHERE sku = :sku
    RETURNING sku
  `, { quantity: quantity, sku: sku });
  await db.execute(q.text, q.params);
}
