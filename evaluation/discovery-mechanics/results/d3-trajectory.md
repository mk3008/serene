# d3 command trajectory

Command argv and output (trailing whitespace trimmed for display); unabridged machine records and snapshots are in the adjacent JSONL.

## Event 1 — exec

```json
["bash", "-lc", "pwd; rg --files -g \"README*\" -g \"!serene/evaluation/**\" | head -50"]
```
```text
/tmp/serene-discovery-mechanics/repos/d3
README.md


```

## Event 2 — exec

```json
["cat", "README.md"]
```
```text
# Mixed ledger

`src/main.ts` is the entrypoint for a ledger posting workflow. A host provides the
`LedgerDriver` interface declared in `src/contracts.ts`; there is no database-driver
implementation in this repository. `execute`, `query`, and `iterate` invoke statements.
`transaction` only supplies a scoped `LedgerSession` to its callback; statements run
when a session method is called.


```

## Event 3 — exec

```json
["rg", "--files"]
```
```text
README.md
src/presentation.ts
src/contracts.ts
src/posting.ts
src/ledgerStore.ts
src/main.ts
src/maintenance.ts
src/reporting.ts


```

## Event 4 — exec

```json
["rg", "-n", "\\b(execute|query|iterate|transaction)\\b|LedgerDriver|LedgerSession", "src"]
```
```text
src/presentation.ts:1:export const queryHelp = "Use the query field to filter the ledger screen.";
src/posting.ts:1:import type { LedgerDriver } from "./contracts";
src/posting.ts:4:export async function postTransfer(driver: LedgerDriver, from: string, to: string, amount: number) {
src/posting.ts:5:  return driver.transaction(async (session) => {
src/posting.ts:12:export async function discardDraft(driver: LedgerDriver, draftId: string) {
src/posting.ts:13:  return driver.transaction(async (session) => new LedgerStore(session).eraseDraft(draftId));
src/contracts.ts:1:export interface LedgerSession {
src/contracts.ts:2:  execute(text: string, values?: readonly unknown[]): Promise<{ affected: number }>;
src/contracts.ts:3:  query(text: string, values?: readonly unknown[]): Promise<unknown[]>;
src/contracts.ts:4:  iterate(text: string, values?: readonly unknown[]): AsyncIterable<unknown>;
src/contracts.ts:7:export interface LedgerDriver extends LedgerSession {
src/contracts.ts:8:  transaction<T>(work: (session: LedgerSession) => Promise<T>): Promise<T>;
src/maintenance.ts:1:import type { LedgerDriver } from "./contracts";
src/maintenance.ts:3:export async function pruneJournal(driver: LedgerDriver, cutoff: string) {
src/maintenance.ts:4:  return driver.execute("delete from journal_cache where created_at < ?", [cutoff]);
src/maintenance.ts:7:export function draftPreview(driver: LedgerDriver) {
src/ledgerStore.ts:1:import type { LedgerSession } from "./contracts";
src/ledgerStore.ts:4:  constructor(private readonly session: LedgerSession) {}
src/ledgerStore.ts:7:    return this.session.execute("insert into ledger_entries(account, amount) values (?, ?)", [account, amount]);
src/ledgerStore.ts:11:    return this.session.query("select account, amount from ledger_entries where account = ?", [account]);
src/ledgerStore.ts:15:    return this.session.execute("delete from ledger_drafts where id = ?", [draftId]);
src/main.ts:1:import type { LedgerDriver } from "./contracts";
src/main.ts:6:export async function runLedger(driver: LedgerDriver) {
src/reporting.ts:1:import type { LedgerDriver } from "./contracts";
src/reporting.ts:4:export function balances(driver: LedgerDriver, account: string) {
src/reporting.ts:8:export function journalFeed(driver: LedgerDriver, since: string) {
src/reporting.ts:9:  return driver.iterate("select account, amount from ledger_entries where posted_at > ?", [since]);


```

## Event 5 — exec

```json
["bash", "-lc", "for f in src/contracts.ts src/ledgerStore.ts src/maintenance.ts src/reporting.ts src/posting.ts src/main.ts; do echo ===$f; cat \"$f\"; done"]
```
```text
===src/contracts.ts
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
===src/ledgerStore.ts
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
===src/maintenance.ts
import type { LedgerDriver } from "./contracts";

export async function pruneJournal(driver: LedgerDriver, cutoff: string) {
  return driver.execute("delete from journal_cache where created_at < ?", [cutoff]);
}

export function draftPreview(driver: LedgerDriver) {
  return driver.prepare("select id from ledger_drafts where owner = ?");
}
===src/reporting.ts
import type { LedgerDriver } from "./contracts";
import { LedgerStore } from "./ledgerStore";

export function balances(driver: LedgerDriver, account: string) {
  return new LedgerStore(driver).entriesFor(account);
}

export function journalFeed(driver: LedgerDriver, since: string) {
  return driver.iterate("select account, amount from ledger_entries where posted_at > ?", [since]);
}
===src/posting.ts
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
===src/main.ts
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


```

## Event 6 — note

README defines execute, query, and iterate as statement-invoking; transaction only scopes a session, and prepare does not execute. Text search plus source inspection found five direct driver/session execution call sites. Wrapper callers include balances -> LedgerStore.entriesFor and postTransfer/discardDraft -> transaction callbacks; excluded from actual execution candidates.

## Event 7 — snapshot

```json
{
  "candidates": [
    {
      "file": "src/ledgerStore.ts",
      "line": 7,
      "function": "LedgerStore.addEntry",
      "status": "confirmed",
      "evidence": "events 4-5: session.execute insert statement; README event 2 defines execute as invoking statements"
    },
    {
      "file": "src/ledgerStore.ts",
      "line": 11,
      "function": "LedgerStore.entriesFor",
      "status": "confirmed",
      "evidence": "events 4-5: session.query select statement; README event 2 defines query as invoking statements"
    },
    {
      "file": "src/ledgerStore.ts",
      "line": 15,
      "function": "LedgerStore.eraseDraft",
      "status": "confirmed",
      "evidence": "events 4-5: session.execute delete statement; README event 2 defines execute as invoking statements"
    },
    {
      "file": "src/maintenance.ts",
      "line": 4,
      "function": "pruneJournal",
      "status": "confirmed",
      "evidence": "events 4-5: driver.execute delete statement; README event 2 defines execute as invoking statements"
    },
    {
      "file": "src/reporting.ts",
      "line": 9,
      "function": "journalFeed",
      "status": "confirmed",
      "evidence": "events 4-5: driver.iterate select statement; README event 2 defines iterate as invoking statements"
    }
  ],
  "added": [
    {
      "file": "src/ledgerStore.ts",
      "line": 7,
      "function": "LedgerStore.addEntry",
      "status": "confirmed",
      "evidence": "events 4-5: session.execute insert statement; README event 2 defines execute as invoking statements"
    },
    {
      "file": "src/ledgerStore.ts",
      "line": 11,
      "function": "LedgerStore.entriesFor",
      "status": "confirmed",
      "evidence": "events 4-5: session.query select statement; README event 2 defines query as invoking statements"
    },
    {
      "file": "src/ledgerStore.ts",
      "line": 15,
      "function": "LedgerStore.eraseDraft",
      "status": "confirmed",
      "evidence": "events 4-5: session.execute delete statement; README event 2 defines execute as invoking statements"
    },
    {
      "file": "src/maintenance.ts",
      "line": 4,
      "function": "pruneJournal",
      "status": "confirmed",
      "evidence": "events 4-5: driver.execute delete statement; README event 2 defines execute as invoking statements"
    },
    {
      "file": "src/reporting.ts",
      "line": 9,
      "function": "journalFeed",
      "status": "confirmed",
      "evidence": "events 4-5: driver.iterate select statement; README event 2 defines iterate as invoking statements"
    }
  ],
  "removed": [],
  "updated": []
}
```

## Event 8 — finish

{"ok": true, "finished": true, "candidate_count": 5}
