# ts recorded trajectory

Every mediated request/response is preserved below. Native orchestration envelopes and model reasoning are not exported. See JSONL for raw rg/CLI subprocess streams and exact response byte counts.

## 1: discovery / info

Request bytes: 13; response bytes: 172.

```json
{
  "op": "info"
}
```
```json
{
  "ok": true,
  "result": {
    "revision": "a9e6b4a5ef3627b4bd4b5f1a8ae42789a44eb55b",
    "files": [
      "README.md",
      "contracts.ts",
      "maintenance.ts",
      "operations.ts",
      "reporting.ts"
    ]
  }
}
```

## 2: discovery / read

Request bytes: 32; response bytes: 839.

```json
{
  "op": "read",
  "file": "README.md"
}
```
```json
{
  "ok": true,
  "result": {
    "lines": [
      {
        "file": "README.md",
        "line": 1,
        "text": "# Ticketing SQL construction review"
      },
      {
        "file": "README.md",
        "line": 2,
        "text": ""
      },
      {
        "file": "README.md",
        "line": 3,
        "text": "Review SQL construction only. `Db.query` and `Db.execute` send SQL text to the"
      },
      {
        "file": "README.md",
        "line": 4,
        "text": "application database; their optional second argument is a native named object for the SQL `:name` placeholders."
      },
      {
        "file": "README.md",
        "line": 5,
        "text": "`Db.sendSql` executes the supplied SQL through a reporting database driver and is"
      },
      {
        "file": "README.md",
        "line": 6,
        "text": "also within construction-review scope. Function inputs typed `UntrustedInput` originate at an HTTP boundary;"
      },
      {
        "file": "README.md",
        "line": 7,
        "text": "all other function inputs are supplied by internal application code."
      }
    ]
  }
}
```

## 3: discovery / search

Request bytes: 66; response bytes: 39.

```json
{
  "op": "search",
  "pattern": "Db\\.(query|execute|sendSql)",
  "file": ""
}
```
```json
{
  "ok": false,
  "error": "invalid path"
}
```

## 4: discovery / search

Request bytes: 56; response bytes: 289.

```json
{
  "op": "search",
  "pattern": "Db\\.(query|execute|sendSql)"
}
```
```json
{
  "ok": true,
  "result": {
    "matches": [
      {
        "file": "README.md",
        "line": 3,
        "text": "Review SQL construction only. `Db.query` and `Db.execute` send SQL text to the"
      },
      {
        "file": "README.md",
        "line": 5,
        "text": "`Db.sendSql` executes the supplied SQL through a reporting database driver and is"
      }
    ]
  }
}
```

## 5: discovery / search

Request bytes: 61; response bytes: 1217.

```json
{
  "op": "search",
  "pattern": "\\b(query|execute|sendSql)\\s*\\("
}
```
```json
{
  "ok": true,
  "result": {
    "matches": [
      {
        "file": "reporting.ts",
        "line": 12,
        "text": "  await db.query(q.text, q.params);"
      },
      {
        "file": "reporting.ts",
        "line": 22,
        "text": "  await db.query(q.text, q.params);"
      },
      {
        "file": "reporting.ts",
        "line": 31,
        "text": "  await db.query(statement);"
      },
      {
        "file": "operations.ts",
        "line": 12,
        "text": "  await db.query(q.text, q.params);"
      },
      {
        "file": "operations.ts",
        "line": 22,
        "text": "  await db.query(q.text, q.params);"
      },
      {
        "file": "operations.ts",
        "line": 32,
        "text": "  await db.execute(q.text, q.params);"
      },
      {
        "file": "operations.ts",
        "line": 42,
        "text": "  await db.execute(q.text, q.params);"
      },
      {
        "file": "maintenance.ts",
        "line": 12,
        "text": "  await db.execute(q.text, q.params);"
      },
      {
        "file": "maintenance.ts",
        "line": 16,
        "text": "  await db.execute(`"
      },
      {
        "file": "maintenance.ts",
        "line": 24,
        "text": "  await db.sendSql(`"
      },
      {
        "file": "contracts.ts",
        "line": 2,
        "text": "  query(text: string, values?: Readonly<Record<string, unknown>>): Promise<void>;"
      },
      {
        "file": "contracts.ts",
        "line": 3,
        "text": "  execute(text: string, values?: Readonly<Record<string, unknown>>): Promise<void>;"
      },
      {
        "file": "contracts.ts",
        "line": 4,
        "text": "  sendSql(text: string): Promise<void>;"
      }
    ]
  }
}
```

## 6: discovery / read

Request bytes: 35; response bytes: 753.

```json
{
  "op": "read",
  "file": "contracts.ts"
}
```
```json
{
  "ok": true,
  "result": {
    "lines": [
      {
        "file": "contracts.ts",
        "line": 1,
        "text": "export interface Db {"
      },
      {
        "file": "contracts.ts",
        "line": 2,
        "text": "  query(text: string, values?: Readonly<Record<string, unknown>>): Promise<void>;"
      },
      {
        "file": "contracts.ts",
        "line": 3,
        "text": "  execute(text: string, values?: Readonly<Record<string, unknown>>): Promise<void>;"
      },
      {
        "file": "contracts.ts",
        "line": 4,
        "text": "  sendSql(text: string): Promise<void>;"
      },
      {
        "file": "contracts.ts",
        "line": 5,
        "text": "}"
      },
      {
        "file": "contracts.ts",
        "line": 6,
        "text": ""
      },
      {
        "file": "contracts.ts",
        "line": 7,
        "text": "/** Values with this type came directly from an HTTP request. */"
      },
      {
        "file": "contracts.ts",
        "line": 8,
        "text": "export type UntrustedInput = string;"
      }
    ]
  }
}
```

## 7: discovery / read

Request bytes: 37; response bytes: 2269.

```json
{
  "op": "read",
  "file": "maintenance.ts"
}
```
```json
{
  "ok": true,
  "result": {
    "lines": [
      {
        "file": "maintenance.ts",
        "line": 1,
        "text": "import { bind, sql } from '@mk3008/serene';"
      },
      {
        "file": "maintenance.ts",
        "line": 2,
        "text": ""
      },
      {
        "file": "maintenance.ts",
        "line": 3,
        "text": "import type { Db, UntrustedInput } from './contracts.js';"
      },
      {
        "file": "maintenance.ts",
        "line": 4,
        "text": ""
      },
      {
        "file": "maintenance.ts",
        "line": 5,
        "text": "export async function reopenTicket(db: Db, state: string, ticketId: string): Promise<void> {"
      },
      {
        "file": "maintenance.ts",
        "line": 6,
        "text": "  const q = bind(sql`"
      },
      {
        "file": "maintenance.ts",
        "line": 7,
        "text": "    UPDATE tickets"
      },
      {
        "file": "maintenance.ts",
        "line": 8,
        "text": "    SET state = :state, closed_at = NULL"
      },
      {
        "file": "maintenance.ts",
        "line": 9,
        "text": "    WHERE id = :ticketId"
      },
      {
        "file": "maintenance.ts",
        "line": 10,
        "text": "    RETURNING id"
      },
      {
        "file": "maintenance.ts",
        "line": 11,
        "text": "  `, { state: state, ticketId: ticketId });"
      },
      {
        "file": "maintenance.ts",
        "line": 12,
        "text": "  await db.execute(q.text, q.params);"
      },
      {
        "file": "maintenance.ts",
        "line": 13,
        "text": "}"
      },
      {
        "file": "maintenance.ts",
        "line": 14,
        "text": ""
      },
      {
        "file": "maintenance.ts",
        "line": 15,
        "text": "export async function purgeTicketingPreview(db: Db): Promise<void> {"
      },
      {
        "file": "maintenance.ts",
        "line": 16,
        "text": "  await db.execute(`"
      },
      {
        "file": "maintenance.ts",
        "line": 17,
        "text": "    DELETE FROM tickets_preview"
      },
      {
        "file": "maintenance.ts",
        "line": 18,
        "text": "    WHERE expires_at < CURRENT_TIMESTAMP"
      },
      {
        "file": "maintenance.ts",
        "line": 19,
        "text": "    RETURNING id"
      },
      {
        "file": "maintenance.ts",
        "line": 20,
        "text": "  `);"
      },
      {
        "file": "maintenance.ts",
        "line": 21,
        "text": "}"
      },
      {
        "file": "maintenance.ts",
        "line": 22,
        "text": ""
      },
      {
        "file": "maintenance.ts",
        "line": 23,
        "text": "export async function sendTicketingSnapshot(db: Db): Promise<void> {"
      },
      {
        "file": "maintenance.ts",
        "line": 24,
        "text": "  await db.sendSql(`"
      },
      {
        "file": "maintenance.ts",
        "line": 25,
        "text": "    SELECT id, created_at"
      },
      {
        "file": "maintenance.ts",
        "line": 26,
        "text": "    FROM tickets"
      },
      {
        "file": "maintenance.ts",
        "line": 27,
        "text": "    WHERE archived = false"
      },
      {
        "file": "maintenance.ts",
        "line": 28,
        "text": "  `);"
      },
      {
        "file": "maintenance.ts",
        "line": 29,
        "text": "}"
      }
    ]
  }
}
```

## 8: discovery / read

Request bytes: 36; response bytes: 3510.

```json
{
  "op": "read",
  "file": "operations.ts"
}
```
```json
{
  "ok": true,
  "result": {
    "lines": [
      {
        "file": "operations.ts",
        "line": 1,
        "text": "import { bind, sql } from '@mk3008/serene';"
      },
      {
        "file": "operations.ts",
        "line": 2,
        "text": ""
      },
      {
        "file": "operations.ts",
        "line": 3,
        "text": "import type { Db, UntrustedInput } from './contracts.js';"
      },
      {
        "file": "operations.ts",
        "line": 4,
        "text": ""
      },
      {
        "file": "operations.ts",
        "line": 5,
        "text": "export async function listOpenTickets(db: Db, state: string): Promise<void> {"
      },
      {
        "file": "operations.ts",
        "line": 6,
        "text": "  const q = bind(sql`"
      },
      {
        "file": "operations.ts",
        "line": 7,
        "text": "    SELECT id, subject, priority"
      },
      {
        "file": "operations.ts",
        "line": 8,
        "text": "    FROM tickets"
      },
      {
        "file": "operations.ts",
        "line": 9,
        "text": "    WHERE state = :state"
      },
      {
        "file": "operations.ts",
        "line": 10,
        "text": "    ORDER BY created_at DESC"
      },
      {
        "file": "operations.ts",
        "line": 11,
        "text": "  `, { state: state });"
      },
      {
        "file": "operations.ts",
        "line": 12,
        "text": "  await db.query(q.text, q.params);"
      },
      {
        "file": "operations.ts",
        "line": 13,
        "text": "}"
      },
      {
        "file": "operations.ts",
        "line": 14,
        "text": ""
      },
      {
        "file": "operations.ts",
        "line": 15,
        "text": "export async function findTicketById(db: Db, ticketId: string): Promise<void> {"
      },
      {
        "file": "operations.ts",
        "line": 16,
        "text": "  const q = bind(sql`"
      },
      {
        "file": "operations.ts",
        "line": 17,
        "text": "    SELECT id, subject, requester_id"
      },
      {
        "file": "operations.ts",
        "line": 18,
        "text": "    FROM tickets"
      },
      {
        "file": "operations.ts",
        "line": 19,
        "text": "    WHERE id = :ticketId"
      },
      {
        "file": "operations.ts",
        "line": 20,
        "text": "    LIMIT 1"
      },
      {
        "file": "operations.ts",
        "line": 21,
        "text": "  `, { ticketId: ticketId });"
      },
      {
        "file": "operations.ts",
        "line": 22,
        "text": "  await db.query(q.text, q.params);"
      },
      {
        "file": "operations.ts",
        "line": 23,
        "text": "}"
      },
      {
        "file": "operations.ts",
        "line": 24,
        "text": ""
      },
      {
        "file": "operations.ts",
        "line": 25,
        "text": "export async function assignTicket(db: Db, agentId: string, ticketId: string): Promise<void> {"
      },
      {
        "file": "operations.ts",
        "line": 26,
        "text": "  const q = bind(sql`"
      },
      {
        "file": "operations.ts",
        "line": 27,
        "text": "    UPDATE tickets"
      },
      {
        "file": "operations.ts",
        "line": 28,
        "text": "    SET assignee_id = :agentId, assigned_at = CURRENT_TIMESTAMP"
      },
      {
        "file": "operations.ts",
        "line": 29,
        "text": "    WHERE id = :ticketId"
      },
      {
        "file": "operations.ts",
        "line": 30,
        "text": "    RETURNING id"
      },
      {
        "file": "operations.ts",
        "line": 31,
        "text": "  `, { agentId: agentId, ticketId: ticketId });"
      },
      {
        "file": "operations.ts",
        "line": 32,
        "text": "  await db.execute(q.text, q.params);"
      },
      {
        "file": "operations.ts",
        "line": 33,
        "text": "}"
      },
      {
        "file": "operations.ts",
        "line": 34,
        "text": ""
      },
      {
        "file": "operations.ts",
        "line": 35,
        "text": "export async function closeResolvedTickets(db: Db, closedState: string, resolvedState: string): Promise<void> {"
      },
      {
        "file": "operations.ts",
        "line": 36,
        "text": "  const q = bind(sql`"
      },
      {
        "file": "operations.ts",
        "line": 37,
        "text": "    UPDATE tickets"
      },
      {
        "file": "operations.ts",
        "line": 38,
        "text": "    SET state = :closedState, closed_at = CURRENT_TIMESTAMP"
      },
      {
        "file": "operations.ts",
        "line": 39,
        "text": "    WHERE state = :resolvedState"
      },
      {
        "file": "operations.ts",
        "line": 40,
        "text": "    RETURNING id"
      },
      {
        "file": "operations.ts",
        "line": 41,
        "text": "  `, { closedState: closedState, resolvedState: resolvedState });"
      },
      {
        "file": "operations.ts",
        "line": 42,
        "text": "  await db.execute(q.text, q.params);"
      },
      {
        "file": "operations.ts",
        "line": 43,
        "text": "}"
      }
    ]
  }
}
```

## 9: discovery / read

Request bytes: 35; response bytes: 2512.

```json
{
  "op": "read",
  "file": "reporting.ts"
}
```
```json
{
  "ok": true,
  "result": {
    "lines": [
      {
        "file": "reporting.ts",
        "line": 1,
        "text": "import { bind, sql } from '@mk3008/serene';"
      },
      {
        "file": "reporting.ts",
        "line": 2,
        "text": ""
      },
      {
        "file": "reporting.ts",
        "line": 3,
        "text": "import type { Db, UntrustedInput } from './contracts.js';"
      },
      {
        "file": "reporting.ts",
        "line": 4,
        "text": ""
      },
      {
        "file": "reporting.ts",
        "line": 5,
        "text": "export async function loadRequesterHistory(db: Db, requesterId: string): Promise<void> {"
      },
      {
        "file": "reporting.ts",
        "line": 6,
        "text": "  const q = bind(sql`"
      },
      {
        "file": "reporting.ts",
        "line": 7,
        "text": "    SELECT t.id, t.subject, t.state"
      },
      {
        "file": "reporting.ts",
        "line": 8,
        "text": "    FROM tickets t"
      },
      {
        "file": "reporting.ts",
        "line": 9,
        "text": "    WHERE t.requester_id = :requesterId"
      },
      {
        "file": "reporting.ts",
        "line": 10,
        "text": "    ORDER BY t.created_at DESC"
      },
      {
        "file": "reporting.ts",
        "line": 11,
        "text": "  `, { requesterId: requesterId });"
      },
      {
        "file": "reporting.ts",
        "line": 12,
        "text": "  await db.query(q.text, q.params);"
      },
      {
        "file": "reporting.ts",
        "line": 13,
        "text": "}"
      },
      {
        "file": "reporting.ts",
        "line": 14,
        "text": ""
      },
      {
        "file": "reporting.ts",
        "line": 15,
        "text": "export async function countQueueByPriority(db: Db, state: string): Promise<void> {"
      },
      {
        "file": "reporting.ts",
        "line": 16,
        "text": "  const q = bind(sql`"
      },
      {
        "file": "reporting.ts",
        "line": 17,
        "text": "    SELECT priority, COUNT(*) AS total"
      },
      {
        "file": "reporting.ts",
        "line": 18,
        "text": "    FROM tickets"
      },
      {
        "file": "reporting.ts",
        "line": 19,
        "text": "    WHERE state = :state"
      },
      {
        "file": "reporting.ts",
        "line": 20,
        "text": "    GROUP BY priority"
      },
      {
        "file": "reporting.ts",
        "line": 21,
        "text": "  `, { state: state });"
      },
      {
        "file": "reporting.ts",
        "line": 22,
        "text": "  await db.query(q.text, q.params);"
      },
      {
        "file": "reporting.ts",
        "line": 23,
        "text": "}"
      },
      {
        "file": "reporting.ts",
        "line": 24,
        "text": ""
      },
      {
        "file": "reporting.ts",
        "line": 25,
        "text": "export async function searchTicketing(db: Db, phrase: UntrustedInput): Promise<void> {"
      },
      {
        "file": "reporting.ts",
        "line": 26,
        "text": "  const statement = `"
      },
      {
        "file": "reporting.ts",
        "line": 27,
        "text": "    SELECT id, subject"
      },
      {
        "file": "reporting.ts",
        "line": 28,
        "text": "    FROM ticketing"
      },
      {
        "file": "reporting.ts",
        "line": 29,
        "text": "    WHERE subject ILIKE '%` + phrase + `%'"
      },
      {
        "file": "reporting.ts",
        "line": 30,
        "text": "  `;"
      },
      {
        "file": "reporting.ts",
        "line": 31,
        "text": "  await db.query(statement);"
      },
      {
        "file": "reporting.ts",
        "line": 32,
        "text": "}"
      }
    ]
  }
}
```

## 10: discovery / discover

Request bytes: 1532; response bytes: 66.

```json
{
  "op": "discover",
  "candidates": [
    {
      "file": "operations.ts",
      "line": 12,
      "column": 9,
      "revision": "a9e6b4a5ef3627b4bd4b5f1a8ae42789a44eb55b",
      "kind": "execution",
      "function": "listOpenTickets"
    },
    {
      "file": "operations.ts",
      "line": 22,
      "column": 9,
      "revision": "a9e6b4a5ef3627b4bd4b5f1a8ae42789a44eb55b",
      "kind": "execution",
      "function": "findTicketById"
    },
    {
      "file": "operations.ts",
      "line": 32,
      "column": 9,
      "revision": "a9e6b4a5ef3627b4bd4b5f1a8ae42789a44eb55b",
      "kind": "execution",
      "function": "assignTicket"
    },
    {
      "file": "operations.ts",
      "line": 42,
      "column": 9,
      "revision": "a9e6b4a5ef3627b4bd4b5f1a8ae42789a44eb55b",
      "kind": "execution",
      "function": "closeResolvedTickets"
    },
    {
      "file": "maintenance.ts",
      "line": 12,
      "column": 9,
      "revision": "a9e6b4a5ef3627b4bd4b5f1a8ae42789a44eb55b",
      "kind": "execution",
      "function": "reopenTicket"
    },
    {
      "file": "maintenance.ts",
      "line": 16,
      "column": 9,
      "revision": "a9e6b4a5ef3627b4bd4b5f1a8ae42789a44eb55b",
      "kind": "execution",
      "function": "purgeTicketingPreview"
    },
    {
      "file": "maintenance.ts",
      "line": 24,
      "column": 9,
      "revision": "a9e6b4a5ef3627b4bd4b5f1a8ae42789a44eb55b",
      "kind": "execution",
      "function": "sendTicketingSnapshot"
    },
    {
      "file": "reporting.ts",
      "line": 12,
      "column": 9,
      "revision": "a9e6b4a5ef3627b4bd4b5f1a8ae42789a44eb55b",
      "kind": "execution",
      "function": "loadRequesterHistory"
    },
    {
      "file": "reporting.ts",
      "line": 22,
      "column": 9,
      "revision": "a9e6b4a5ef3627b4bd4b5f1a8ae42789a44eb55b",
      "kind": "execution",
      "function": "countQueueByPriority"
    },
    {
      "file": "reporting.ts",
      "line": 31,
      "column": 9,
      "revision": "a9e6b4a5ef3627b4bd4b5f1a8ae42789a44eb55b",
      "kind": "execution",
      "function": "searchTicketing"
    }
  ]
}
```
```json
{
  "ok": true,
  "result": {
    "candidate_count": 10,
    "recorded": true
  }
}
```

## 11: review / handoff

Request bytes: 16; response bytes: 3979.

```json
{
  "op": "handoff"
}
```
```json
{
  "ok": true,
  "result": {
    "stdout": "{\"ordinal\":1,\"candidate\":{\"file\":\"operations.ts\",\"line\":12,\"column\":9,\"revision\":\"a9e6b4a5ef3627b4bd4b5f1a8ae42789a44eb55b\",\"kind\":\"execution\",\"function\":\"listOpenTickets\"},\"classification\":\"ordinary\",\"skip\":true,\"reason\":\"SCREENED_SOURCE\",\"matched\":{\"file\":\"operations.ts\",\"line\":12,\"column\":9,\"revision\":\"a9e6b4a5ef3627b4bd4b5f1a8ae42789a44eb55b\"}}\n{\"ordinal\":2,\"candidate\":{\"file\":\"operations.ts\",\"line\":22,\"column\":9,\"revision\":\"a9e6b4a5ef3627b4bd4b5f1a8ae42789a44eb55b\",\"kind\":\"execution\",\"function\":\"findTicketById\"},\"classification\":\"ordinary\",\"skip\":true,\"reason\":\"SCREENED_SOURCE\",\"matched\":{\"file\":\"operations.ts\",\"line\":22,\"column\":9,\"revision\":\"a9e6b4a5ef3627b4bd4b5f1a8ae42789a44eb55b\"}}\n{\"ordinal\":3,\"candidate\":{\"file\":\"operations.ts\",\"line\":32,\"column\":9,\"revision\":\"a9e6b4a5ef3627b4bd4b5f1a8ae42789a44eb55b\",\"kind\":\"execution\",\"function\":\"assignTicket\"},\"classification\":\"ordinary\",\"skip\":true,\"reason\":\"SCREENED_SOURCE\",\"matched\":{\"file\":\"operations.ts\",\"line\":32,\"column\":9,\"revision\":\"a9e6b4a5ef3627b4bd4b5f1a8ae42789a44eb55b\"}}\n{\"ordinal\":4,\"candidate\":{\"file\":\"operations.ts\",\"line\":42,\"column\":9,\"revision\":\"a9e6b4a5ef3627b4bd4b5f1a8ae42789a44eb55b\",\"kind\":\"execution\",\"function\":\"closeResolvedTickets\"},\"classification\":\"ordinary\",\"skip\":true,\"reason\":\"SCREENED_SOURCE\",\"matched\":{\"file\":\"operations.ts\",\"line\":42,\"column\":9,\"revision\":\"a9e6b4a5ef3627b4bd4b5f1a8ae42789a44eb55b\"}}\n{\"ordinal\":5,\"candidate\":{\"file\":\"maintenance.ts\",\"line\":12,\"column\":9,\"revision\":\"a9e6b4a5ef3627b4bd4b5f1a8ae42789a44eb55b\",\"kind\":\"execution\",\"function\":\"reopenTicket\"},\"classification\":\"ordinary\",\"skip\":true,\"reason\":\"SCREENED_SOURCE\",\"matched\":{\"file\":\"maintenance.ts\",\"line\":12,\"column\":9,\"revision\":\"a9e6b4a5ef3627b4bd4b5f1a8ae42789a44eb55b\"}}\n{\"ordinal\":6,\"candidate\":{\"file\":\"maintenance.ts\",\"line\":16,\"column\":9,\"revision\":\"a9e6b4a5ef3627b4bd4b5f1a8ae42789a44eb55b\",\"kind\":\"execution\",\"function\":\"purgeTicketingPreview\"},\"classification\":\"review-required\",\"skip\":false,\"reason\":\"UNRESOLVED\",\"matched\":{\"file\":\"maintenance.ts\",\"line\":16,\"column\":9,\"revision\":\"a9e6b4a5ef3627b4bd4b5f1a8ae42789a44eb55b\"}}\n{\"ordinal\":7,\"candidate\":{\"file\":\"maintenance.ts\",\"line\":24,\"column\":9,\"revision\":\"a9e6b4a5ef3627b4bd4b5f1a8ae42789a44eb55b\",\"kind\":\"execution\",\"function\":\"sendTicketingSnapshot\"},\"classification\":\"unmatched\",\"skip\":false,\"reason\":\"no-execution-match\"}\n{\"ordinal\":8,\"candidate\":{\"file\":\"reporting.ts\",\"line\":12,\"column\":9,\"revision\":\"a9e6b4a5ef3627b4bd4b5f1a8ae42789a44eb55b\",\"kind\":\"execution\",\"function\":\"loadRequesterHistory\"},\"classification\":\"ordinary\",\"skip\":true,\"reason\":\"SCREENED_SOURCE\",\"matched\":{\"file\":\"reporting.ts\",\"line\":12,\"column\":9,\"revision\":\"a9e6b4a5ef3627b4bd4b5f1a8ae42789a44eb55b\"}}\n{\"ordinal\":9,\"candidate\":{\"file\":\"reporting.ts\",\"line\":22,\"column\":9,\"revision\":\"a9e6b4a5ef3627b4bd4b5f1a8ae42789a44eb55b\",\"kind\":\"execution\",\"function\":\"countQueueByPriority\"},\"classification\":\"ordinary\",\"skip\":true,\"reason\":\"SCREENED_SOURCE\",\"matched\":{\"file\":\"reporting.ts\",\"line\":22,\"column\":9,\"revision\":\"a9e6b4a5ef3627b4bd4b5f1a8ae42789a44eb55b\"}}\n{\"ordinal\":10,\"candidate\":{\"file\":\"reporting.ts\",\"line\":31,\"column\":9,\"revision\":\"a9e6b4a5ef3627b4bd4b5f1a8ae42789a44eb55b\",\"kind\":\"execution\",\"function\":\"searchTicketing\"},\"classification\":\"violation\",\"skip\":false,\"reason\":\"STRING_CONSTRUCTION\",\"matched\":{\"file\":\"reporting.ts\",\"line\":31,\"column\":9,\"revision\":\"a9e6b4a5ef3627b4bd4b5f1a8ae42789a44eb55b\"}}\n",
    "stderr": "",
    "exit_code": 0
  }
}
```

## 12: review / finding

Request bytes: 342; response bytes: 43.

```json
{
  "op": "finding",
  "file": "reporting.ts",
  "line": 29,
  "function": "searchTicketing",
  "mechanism": "UntrustedInput phrase is concatenated into the SQL string used by db.query, allowing injected SQL syntax to terminate the ILIKE literal and append/alter clauses.",
  "impact": "HTTP-controlled phrase can alter the reporting query, enabling SQL injection."
}
```
```json
{
  "ok": true,
  "result": {
    "recorded": true
  }
}
```

## 13: review / finish

Request bytes: 1002; response bytes: 43.

```json
{
  "op": "finish",
  "dispositions": [
    {
      "file": "operations.ts",
      "line": 12,
      "column": 9,
      "resolution": "skip-ordinary"
    },
    {
      "file": "operations.ts",
      "line": 22,
      "column": 9,
      "resolution": "skip-ordinary"
    },
    {
      "file": "operations.ts",
      "line": 32,
      "column": 9,
      "resolution": "skip-ordinary"
    },
    {
      "file": "operations.ts",
      "line": 42,
      "column": 9,
      "resolution": "skip-ordinary"
    },
    {
      "file": "maintenance.ts",
      "line": 12,
      "column": 9,
      "resolution": "skip-ordinary"
    },
    {
      "file": "maintenance.ts",
      "line": 16,
      "column": 9,
      "resolution": "safe: static DELETE statement contains no function input or dynamic SQL construction"
    },
    {
      "file": "maintenance.ts",
      "line": 24,
      "column": 9,
      "resolution": "safe: static SELECT statement contains no function input or dynamic SQL construction"
    },
    {
      "file": "reporting.ts",
      "line": 12,
      "column": 9,
      "resolution": "skip-ordinary"
    },
    {
      "file": "reporting.ts",
      "line": 22,
      "column": 9,
      "resolution": "skip-ordinary"
    },
    {
      "file": "reporting.ts",
      "line": 31,
      "column": 9,
      "resolution": "unsafe: searchTicketing concatenates HTTP-originated phrase into SQL syntax before db.query"
    }
  ]
}
```
```json
{
  "ok": true,
  "result": {
    "finished": true
  }
}
```
