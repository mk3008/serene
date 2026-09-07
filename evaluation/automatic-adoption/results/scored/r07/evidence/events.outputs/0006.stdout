import { DatabaseSync } from 'node:sqlite';

export function openStockroom() {
  const db = new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE products (id INTEGER PRIMARY KEY, sku TEXT NOT NULL, name TEXT NOT NULL, on_hand INTEGER NOT NULL);
    INSERT INTO products (sku, name, on_hand) VALUES ('PEN-0042', 'Blue pen', 18), ('BOX-1200', 'Archive box', 4);`);
  return db;
}

export function inventoryTotal(db) {
  return db.prepare('SELECT SUM(on_hand) AS total FROM products').get().total;
}

export function findProductBySku(db, sku) {
  if (typeof sku !== 'string' || !/^[A-Z]{3}-\d{4}$/.test(sku)) {
    throw new TypeError('SKU must be three uppercase letters, a dash, and four digits');
  }

  const product = db.prepare('SELECT id, sku, name, on_hand FROM products WHERE sku = ?').get(sku);
  if (product === undefined) return null;

  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    on_hand: product.on_hand,
  };
}
