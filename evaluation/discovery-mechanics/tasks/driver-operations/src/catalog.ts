import type { SqlPool } from "./db";

export async function listShelf(pool: SqlPool, shelf: string) {
  return pool.query("select sku, title from catalog where shelf = ?", [shelf]);
}

export async function renameSku(pool: SqlPool, sku: string, title: string) {
  return pool.execute("update catalog set title = ? where sku = ?", [title, sku]);
}

export function catalogLookupText() {
  return "select sku from catalog where title like ?";
}
