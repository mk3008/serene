import type { LedgerDriver } from "./contracts";

export async function pruneJournal(driver: LedgerDriver, cutoff: string) {
  return driver.execute("delete from journal_cache where created_at < ?", [cutoff]);
}

export function draftPreview(driver: LedgerDriver) {
  return driver.prepare("select id from ledger_drafts where owner = ?");
}
