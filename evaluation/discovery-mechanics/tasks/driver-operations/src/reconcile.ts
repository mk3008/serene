import type { BatchDriver, SqlPool } from "./db";

export async function postCounts(driver: BatchDriver, rows: readonly [string, number][]) {
  return driver.batch(rows.map(([sku, count]) => ({
    text: "update catalog set counted = ? where sku = ?",
    values: [count, sku],
  })));
}

export async function clearStaging(pool: SqlPool, runId: string) {
  return pool.execute("delete from staging_counts where run_id = ?", [runId]);
}

export function stageStatement(pool: SqlPool) {
  return pool.prepare("select sku from staging_counts where run_id = ?");
}
