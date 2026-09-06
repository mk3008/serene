import type { LedgerDriver } from "./contracts";
import { pruneJournal } from "./maintenance";
import { postTransfer } from "./posting";
import { balances, journalFeed } from "./reporting";

export async function runLedger(driver: LedgerDriver) {
  await postTransfer(driver, "cash", "revenue", 500);
  await balances(driver, "cash");
  await pruneJournal(driver, "2025-01-01");
  return journalFeed(driver, "2025-02-01");
}
