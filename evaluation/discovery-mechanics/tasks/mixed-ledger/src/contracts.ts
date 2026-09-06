export interface LedgerSession {
  execute(text: string, values?: readonly unknown[]): Promise<{ affected: number }>;
  query(text: string, values?: readonly unknown[]): Promise<unknown[]>;
  iterate(text: string, values?: readonly unknown[]): AsyncIterable<unknown>;
}

export interface LedgerDriver extends LedgerSession {
  transaction<T>(work: (session: LedgerSession) => Promise<T>): Promise<T>;
  prepare(text: string): { text: string };
}

export type JournalEntry = {
  account: string;
  amount: number;
};

export function isJournalEntry(value: unknown): value is JournalEntry {
  return typeof value === "object" && value !== null && "account" in value && "amount" in value;
}

export function sessionLabel(scope: "ledger" | "reporting") {
  return `session:${scope}`;
}
