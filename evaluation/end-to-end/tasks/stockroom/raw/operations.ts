import type { Db, UntrustedInput } from './contracts.js';

export async function listReorderItems(db: Db): Promise<void> {
  const statement = `
    SELECT sku, item_name, on_hand
    FROM stock_items
    WHERE on_hand <= reorder_point
    ORDER BY sku
  `;
  await db.query(statement, {});
}

export async function findBinBalance(db: Db, binCode: string): Promise<void> {
  const statement = `
    SELECT bin_code, sku, quantity
    FROM bin_balances
    WHERE bin_code = :binCode
    ORDER BY sku
  `;
  await db.query(statement, { binCode: binCode });
}

export async function reserveStock(db: Db, quantity: string, sku: string): Promise<void> {
  const statement = `
    UPDATE stock_items
    SET reserved = reserved + :quantity
    WHERE sku = :sku
    RETURNING sku
  `;
  await db.execute(statement, { quantity: quantity, sku: sku });
}

export async function releaseReservation(db: Db, quantity: string, sku: string): Promise<void> {
  const statement = `
    UPDATE stock_items
    SET reserved = reserved - :quantity
    WHERE sku = :sku
    RETURNING sku
  `;
  await db.execute(statement, { quantity: quantity, sku: sku });
}
