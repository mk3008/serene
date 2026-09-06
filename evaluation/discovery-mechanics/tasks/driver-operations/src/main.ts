import type { BatchDriver, SqlClient, SqlPool } from "./db";
import { listShelf, renameSku } from "./catalog";
import { clearStaging, postCounts } from "./reconcile";
import { markEmailed, receiptFor } from "./receipts";

export async function runInventory(pool: SqlPool, client: SqlClient, batch: BatchDriver) {
  await listShelf(pool, "A1");
  await renameSku(pool, "P-17", "Pencil set");
  await receiptFor(client, "R-3");
  await markEmailed(client, "R-3");
  await postCounts(batch, [["P-17", 24]]);
  return clearStaging(pool, "nightly");
}
