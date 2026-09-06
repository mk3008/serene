import type { LedgerDriver } from "./contracts";
import { LedgerStore } from "./ledgerStore";

export async function postTransfer(driver: LedgerDriver, from: string, to: string, amount: number) {
  return driver.transaction(async (session) => {
    const store = new LedgerStore(session);
    await store.addEntry(from, -amount);
    return store.addEntry(to, amount);
  });
}

export async function discardDraft(driver: LedgerDriver, draftId: string) {
  return driver.transaction(async (session) => new LedgerStore(session).eraseDraft(draftId));
}
