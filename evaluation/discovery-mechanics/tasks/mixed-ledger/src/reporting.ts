import type { LedgerDriver } from "./contracts";
import { LedgerStore } from "./ledgerStore";

export function balances(driver: LedgerDriver, account: string) {
  return new LedgerStore(driver).entriesFor(account);
}

export function journalFeed(driver: LedgerDriver, since: string) {
  return driver.iterate("select account, amount from ledger_entries where posted_at > ?", [since]);
}
