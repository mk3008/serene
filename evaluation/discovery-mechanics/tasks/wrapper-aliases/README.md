# Wrapper aliases

`src/main.ts` starts a fulfillment workflow. A host supplies the `Driver` interface
from `src/contracts.ts`; this repository provides no driver implementation. `query`, `execute`, and
`stream` run statements when called; `prepare` returns metadata without executing. The application routes database
work through gateway functions, including their re-exported names.
