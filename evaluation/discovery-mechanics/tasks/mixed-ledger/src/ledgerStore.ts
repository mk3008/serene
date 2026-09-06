import type { LedgerSession } from "./contracts";

export class LedgerStore {
  constructor(private readonly session: LedgerSession) {}

  addEntry(account: string, amount: number) {
    return this.session.execute("insert into ledger_entries(account, amount) values (?, ?)", [account, amount]);
  }

  entriesFor(account: string) {
    return this.session.query("select account, amount from ledger_entries where account = ?", [account]);
  }

  eraseDraft(draftId: string) {
    return this.session.execute("delete from ledger_drafts where id = ?", [draftId]);
  }
}
