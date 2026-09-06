export const queryHelp = "Use the query field to filter the ledger screen.";
export const executeButtonText = "Execute export";

export function buildDownloadPath(account: string) {
  return `/exports/${account}?format=ledger`;
}

export function logStatementName(name: string) {
  console.info("statement", name);
}

export type LedgerView = "activity" | "balances" | "drafts";

export interface LedgerFilter {
  view: LedgerView;
  account?: string;
  since?: string;
}

export function defaultFilter(): LedgerFilter {
  return { view: "activity" };
}

export function describeFilter(filter: LedgerFilter) {
  const parts = [filter.view, filter.account, filter.since].filter(Boolean);
  return parts.join(" / ");
}

export function parseView(value: string): LedgerView {
  if (value === "balances" || value === "drafts") return value;
  return "activity";
}

export function ledgerColumns(view: LedgerView) {
  if (view === "balances") return ["account", "balance"];
  if (view === "drafts") return ["id", "owner", "created"];
  return ["account", "amount", "posted"];
}

export function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export function pageTitle(view: LedgerView) {
  return `Ledger ${view}`;
}
