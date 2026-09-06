# Mixed ledger

`src/main.ts` is the entrypoint for a ledger posting workflow. A host provides the
`LedgerDriver` interface declared in `src/contracts.ts`; there is no database-driver
implementation in this repository. `execute`, `query`, and `iterate` invoke statements.
`transaction` only supplies a scoped `LedgerSession` to its callback; statements run
when a session method is called.
