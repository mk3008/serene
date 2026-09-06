import type { SqlClient } from "./db";

export async function receiptFor(client: SqlClient, receiptId: string) {
  return client.query("select id, total from receipts where id = ?", [receiptId]);
}

export async function markEmailed(client: SqlClient, receiptId: string) {
  return client.execute("update receipts set emailed_at = current_timestamp where id = ?", [receiptId]);
}

export const receiptColumns = ["id", "total", "emailed_at"];
