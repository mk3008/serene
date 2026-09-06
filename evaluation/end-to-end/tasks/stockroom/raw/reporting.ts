import type { Db, UntrustedInput } from './contracts.js';

export async function loadSupplierItems(db: Db, supplierId: string): Promise<void> {
  const statement = `
    SELECT sku, item_name, supplier_id
    FROM stock_items
    WHERE supplier_id = :supplierId
    ORDER BY item_name
  `;
  await db.query(statement, { supplierId: supplierId });
}

export async function countItemsByZone(db: Db, minimum: string): Promise<void> {
  const statement = `
    SELECT zone, COUNT(*) AS total
    FROM bin_balances
    WHERE quantity > :minimum
    GROUP BY zone
  `;
  await db.query(statement, { minimum: minimum });
}

export async function searchStockroom(db: Db, phrase: UntrustedInput): Promise<void> {
  const statement = `
    SELECT id, item_name
    FROM stockroom
    WHERE item_name ILIKE '%` + phrase + `%'
  `;
  await db.query(statement);
}
