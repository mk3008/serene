# ss recorded trajectory

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
    "revision": "10241d647759a95fc149da81fa6f664bd2d1fc51",
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
        "text": "# Stockroom SQL construction review"
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

Request bytes: 36; response bytes: 162.

```json
{
  "op": "search",
  "pattern": "Db.query"
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
      }
    ]
  }
}
```

## 4: discovery / search

Request bytes: 36; response bytes: 99.

```json
{
  "op": "search",
  "pattern": "execute("
}
```
```json
{
  "ok": false,
  "error": "rg: regex parse error:\n    (?:execute()\n    ^\nerror: unclosed group\n"
}
```

## 5: discovery / search

Request bytes: 38; response bytes: 165.

```json
{
  "op": "search",
  "pattern": "Db.sendSql"
}
```
```json
{
  "ok": true,
  "result": {
    "matches": [
      {
        "file": "README.md",
        "line": 5,
        "text": "`Db.sendSql` executes the supplied SQL through a reporting database driver and is"
      }
    ]
  }
}
```

## 6: discovery / search

Request bytes: 34; response bytes: 97.

```json
{
  "op": "search",
  "pattern": "query("
}
```
```json
{
  "ok": false,
  "error": "rg: regex parse error:\n    (?:query()\n    ^\nerror: unclosed group\n"
}
```

## 7: discovery / search

Request bytes: 38; response bytes: 162.

```json
{
  "op": "search",
  "pattern": "Db.execute"
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
      }
    ]
  }
}
```

## 8: discovery / search

Request bytes: 59; response bytes: 39.

```json
{
  "op": "search",
  "pattern": "query|execute|sendSql",
  "file": ""
}
```
```json
{
  "ok": false,
  "error": "invalid path"
}
```

## 9: discovery / search

Request bytes: 49; response bytes: 1468.

```json
{
  "op": "search",
  "pattern": "query|execute|sendSql"
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
      },
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

## 10: discovery / read

Request bytes: 36; response bytes: 3395.

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
        "text": "export async function listReorderItems(db: Db): Promise<void> {"
      },
      {
        "file": "operations.ts",
        "line": 6,
        "text": "  const q = bind(sql`"
      },
      {
        "file": "operations.ts",
        "line": 7,
        "text": "    SELECT sku, item_name, on_hand"
      },
      {
        "file": "operations.ts",
        "line": 8,
        "text": "    FROM stock_items"
      },
      {
        "file": "operations.ts",
        "line": 9,
        "text": "    WHERE on_hand <= reorder_point"
      },
      {
        "file": "operations.ts",
        "line": 10,
        "text": "    ORDER BY sku"
      },
      {
        "file": "operations.ts",
        "line": 11,
        "text": "  `, {  });"
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
        "text": "export async function findBinBalance(db: Db, binCode: string): Promise<void> {"
      },
      {
        "file": "operations.ts",
        "line": 16,
        "text": "  const q = bind(sql`"
      },
      {
        "file": "operations.ts",
        "line": 17,
        "text": "    SELECT bin_code, sku, quantity"
      },
      {
        "file": "operations.ts",
        "line": 18,
        "text": "    FROM bin_balances"
      },
      {
        "file": "operations.ts",
        "line": 19,
        "text": "    WHERE bin_code = :binCode"
      },
      {
        "file": "operations.ts",
        "line": 20,
        "text": "    ORDER BY sku"
      },
      {
        "file": "operations.ts",
        "line": 21,
        "text": "  `, { binCode: binCode });"
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
        "text": "export async function reserveStock(db: Db, quantity: string, sku: string): Promise<void> {"
      },
      {
        "file": "operations.ts",
        "line": 26,
        "text": "  const q = bind(sql`"
      },
      {
        "file": "operations.ts",
        "line": 27,
        "text": "    UPDATE stock_items"
      },
      {
        "file": "operations.ts",
        "line": 28,
        "text": "    SET reserved = reserved + :quantity"
      },
      {
        "file": "operations.ts",
        "line": 29,
        "text": "    WHERE sku = :sku"
      },
      {
        "file": "operations.ts",
        "line": 30,
        "text": "    RETURNING sku"
      },
      {
        "file": "operations.ts",
        "line": 31,
        "text": "  `, { quantity: quantity, sku: sku });"
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
        "text": "export async function releaseReservation(db: Db, quantity: string, sku: string): Promise<void> {"
      },
      {
        "file": "operations.ts",
        "line": 36,
        "text": "  const q = bind(sql`"
      },
      {
        "file": "operations.ts",
        "line": 37,
        "text": "    UPDATE stock_items"
      },
      {
        "file": "operations.ts",
        "line": 38,
        "text": "    SET reserved = reserved - :quantity"
      },
      {
        "file": "operations.ts",
        "line": 39,
        "text": "    WHERE sku = :sku"
      },
      {
        "file": "operations.ts",
        "line": 40,
        "text": "    RETURNING sku"
      },
      {
        "file": "operations.ts",
        "line": 41,
        "text": "  `, { quantity: quantity, sku: sku });"
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

## 11: discovery / read

Request bytes: 37; response bytes: 2276.

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
        "text": "export async function receiveShipment(db: Db, quantity: string, sku: string): Promise<void> {"
      },
      {
        "file": "maintenance.ts",
        "line": 6,
        "text": "  const q = bind(sql`"
      },
      {
        "file": "maintenance.ts",
        "line": 7,
        "text": "    UPDATE stock_items"
      },
      {
        "file": "maintenance.ts",
        "line": 8,
        "text": "    SET on_hand = on_hand + :quantity"
      },
      {
        "file": "maintenance.ts",
        "line": 9,
        "text": "    WHERE sku = :sku"
      },
      {
        "file": "maintenance.ts",
        "line": 10,
        "text": "    RETURNING on_hand"
      },
      {
        "file": "maintenance.ts",
        "line": 11,
        "text": "  `, { quantity: quantity, sku: sku });"
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
        "text": "export async function purgeStockroomPreview(db: Db): Promise<void> {"
      },
      {
        "file": "maintenance.ts",
        "line": 16,
        "text": "  await db.execute(`"
      },
      {
        "file": "maintenance.ts",
        "line": 17,
        "text": "    DELETE FROM stock_items_preview"
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
        "text": "export async function sendStockroomSnapshot(db: Db): Promise<void> {"
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
        "text": "    FROM stock_items"
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

## 12: discovery / read

Request bytes: 35; response bytes: 2507.

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
        "text": "export async function loadSupplierItems(db: Db, supplierId: string): Promise<void> {"
      },
      {
        "file": "reporting.ts",
        "line": 6,
        "text": "  const q = bind(sql`"
      },
      {
        "file": "reporting.ts",
        "line": 7,
        "text": "    SELECT sku, item_name, supplier_id"
      },
      {
        "file": "reporting.ts",
        "line": 8,
        "text": "    FROM stock_items"
      },
      {
        "file": "reporting.ts",
        "line": 9,
        "text": "    WHERE supplier_id = :supplierId"
      },
      {
        "file": "reporting.ts",
        "line": 10,
        "text": "    ORDER BY item_name"
      },
      {
        "file": "reporting.ts",
        "line": 11,
        "text": "  `, { supplierId: supplierId });"
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
        "text": "export async function countItemsByZone(db: Db, minimum: string): Promise<void> {"
      },
      {
        "file": "reporting.ts",
        "line": 16,
        "text": "  const q = bind(sql`"
      },
      {
        "file": "reporting.ts",
        "line": 17,
        "text": "    SELECT zone, COUNT(*) AS total"
      },
      {
        "file": "reporting.ts",
        "line": 18,
        "text": "    FROM bin_balances"
      },
      {
        "file": "reporting.ts",
        "line": 19,
        "text": "    WHERE quantity > :minimum"
      },
      {
        "file": "reporting.ts",
        "line": 20,
        "text": "    GROUP BY zone"
      },
      {
        "file": "reporting.ts",
        "line": 21,
        "text": "  `, { minimum: minimum });"
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
        "text": "export async function searchStockroom(db: Db, phrase: UntrustedInput): Promise<void> {"
      },
      {
        "file": "reporting.ts",
        "line": 26,
        "text": "  const statement = `"
      },
      {
        "file": "reporting.ts",
        "line": 27,
        "text": "    SELECT id, item_name"
      },
      {
        "file": "reporting.ts",
        "line": 28,
        "text": "    FROM stockroom"
      },
      {
        "file": "reporting.ts",
        "line": 29,
        "text": "    WHERE item_name ILIKE '%` + phrase + `%'"
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

## 13: discovery / read

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

## 14: discovery / discover

Request bytes: 1527; response bytes: 66.

```json
{
  "op": "discover",
  "candidates": [
    {
      "file": "reporting.ts",
      "line": 12,
      "column": 9,
      "revision": "10241d647759a95fc149da81fa6f664bd2d1fc51",
      "kind": "execution",
      "function": "loadSupplierItems"
    },
    {
      "file": "reporting.ts",
      "line": 22,
      "column": 9,
      "revision": "10241d647759a95fc149da81fa6f664bd2d1fc51",
      "kind": "execution",
      "function": "countItemsByZone"
    },
    {
      "file": "reporting.ts",
      "line": 31,
      "column": 9,
      "revision": "10241d647759a95fc149da81fa6f664bd2d1fc51",
      "kind": "execution",
      "function": "searchStockroom"
    },
    {
      "file": "operations.ts",
      "line": 12,
      "column": 9,
      "revision": "10241d647759a95fc149da81fa6f664bd2d1fc51",
      "kind": "execution",
      "function": "listReorderItems"
    },
    {
      "file": "operations.ts",
      "line": 22,
      "column": 9,
      "revision": "10241d647759a95fc149da81fa6f664bd2d1fc51",
      "kind": "execution",
      "function": "findBinBalance"
    },
    {
      "file": "operations.ts",
      "line": 32,
      "column": 9,
      "revision": "10241d647759a95fc149da81fa6f664bd2d1fc51",
      "kind": "execution",
      "function": "reserveStock"
    },
    {
      "file": "operations.ts",
      "line": 42,
      "column": 9,
      "revision": "10241d647759a95fc149da81fa6f664bd2d1fc51",
      "kind": "execution",
      "function": "releaseReservation"
    },
    {
      "file": "maintenance.ts",
      "line": 12,
      "column": 9,
      "revision": "10241d647759a95fc149da81fa6f664bd2d1fc51",
      "kind": "execution",
      "function": "receiveShipment"
    },
    {
      "file": "maintenance.ts",
      "line": 16,
      "column": 9,
      "revision": "10241d647759a95fc149da81fa6f664bd2d1fc51",
      "kind": "execution",
      "function": "purgeStockroomPreview"
    },
    {
      "file": "maintenance.ts",
      "line": 24,
      "column": 9,
      "revision": "10241d647759a95fc149da81fa6f664bd2d1fc51",
      "kind": "execution",
      "function": "sendStockroomSnapshot"
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

## 15: review / handoff

Request bytes: 16; response bytes: 3974.

```json
{
  "op": "handoff"
}
```
```json
{
  "ok": true,
  "result": {
    "stdout": "{\"ordinal\":1,\"candidate\":{\"file\":\"reporting.ts\",\"line\":12,\"column\":9,\"revision\":\"10241d647759a95fc149da81fa6f664bd2d1fc51\",\"kind\":\"execution\",\"function\":\"loadSupplierItems\"},\"classification\":\"ordinary\",\"skip\":true,\"reason\":\"SCREENED_SOURCE\",\"matched\":{\"file\":\"reporting.ts\",\"line\":12,\"column\":9,\"revision\":\"10241d647759a95fc149da81fa6f664bd2d1fc51\"}}\n{\"ordinal\":2,\"candidate\":{\"file\":\"reporting.ts\",\"line\":22,\"column\":9,\"revision\":\"10241d647759a95fc149da81fa6f664bd2d1fc51\",\"kind\":\"execution\",\"function\":\"countItemsByZone\"},\"classification\":\"ordinary\",\"skip\":true,\"reason\":\"SCREENED_SOURCE\",\"matched\":{\"file\":\"reporting.ts\",\"line\":22,\"column\":9,\"revision\":\"10241d647759a95fc149da81fa6f664bd2d1fc51\"}}\n{\"ordinal\":3,\"candidate\":{\"file\":\"reporting.ts\",\"line\":31,\"column\":9,\"revision\":\"10241d647759a95fc149da81fa6f664bd2d1fc51\",\"kind\":\"execution\",\"function\":\"searchStockroom\"},\"classification\":\"violation\",\"skip\":false,\"reason\":\"STRING_CONSTRUCTION\",\"matched\":{\"file\":\"reporting.ts\",\"line\":31,\"column\":9,\"revision\":\"10241d647759a95fc149da81fa6f664bd2d1fc51\"}}\n{\"ordinal\":4,\"candidate\":{\"file\":\"operations.ts\",\"line\":12,\"column\":9,\"revision\":\"10241d647759a95fc149da81fa6f664bd2d1fc51\",\"kind\":\"execution\",\"function\":\"listReorderItems\"},\"classification\":\"ordinary\",\"skip\":true,\"reason\":\"SCREENED_SOURCE\",\"matched\":{\"file\":\"operations.ts\",\"line\":12,\"column\":9,\"revision\":\"10241d647759a95fc149da81fa6f664bd2d1fc51\"}}\n{\"ordinal\":5,\"candidate\":{\"file\":\"operations.ts\",\"line\":22,\"column\":9,\"revision\":\"10241d647759a95fc149da81fa6f664bd2d1fc51\",\"kind\":\"execution\",\"function\":\"findBinBalance\"},\"classification\":\"ordinary\",\"skip\":true,\"reason\":\"SCREENED_SOURCE\",\"matched\":{\"file\":\"operations.ts\",\"line\":22,\"column\":9,\"revision\":\"10241d647759a95fc149da81fa6f664bd2d1fc51\"}}\n{\"ordinal\":6,\"candidate\":{\"file\":\"operations.ts\",\"line\":32,\"column\":9,\"revision\":\"10241d647759a95fc149da81fa6f664bd2d1fc51\",\"kind\":\"execution\",\"function\":\"reserveStock\"},\"classification\":\"ordinary\",\"skip\":true,\"reason\":\"SCREENED_SOURCE\",\"matched\":{\"file\":\"operations.ts\",\"line\":32,\"column\":9,\"revision\":\"10241d647759a95fc149da81fa6f664bd2d1fc51\"}}\n{\"ordinal\":7,\"candidate\":{\"file\":\"operations.ts\",\"line\":42,\"column\":9,\"revision\":\"10241d647759a95fc149da81fa6f664bd2d1fc51\",\"kind\":\"execution\",\"function\":\"releaseReservation\"},\"classification\":\"ordinary\",\"skip\":true,\"reason\":\"SCREENED_SOURCE\",\"matched\":{\"file\":\"operations.ts\",\"line\":42,\"column\":9,\"revision\":\"10241d647759a95fc149da81fa6f664bd2d1fc51\"}}\n{\"ordinal\":8,\"candidate\":{\"file\":\"maintenance.ts\",\"line\":12,\"column\":9,\"revision\":\"10241d647759a95fc149da81fa6f664bd2d1fc51\",\"kind\":\"execution\",\"function\":\"receiveShipment\"},\"classification\":\"ordinary\",\"skip\":true,\"reason\":\"SCREENED_SOURCE\",\"matched\":{\"file\":\"maintenance.ts\",\"line\":12,\"column\":9,\"revision\":\"10241d647759a95fc149da81fa6f664bd2d1fc51\"}}\n{\"ordinal\":9,\"candidate\":{\"file\":\"maintenance.ts\",\"line\":16,\"column\":9,\"revision\":\"10241d647759a95fc149da81fa6f664bd2d1fc51\",\"kind\":\"execution\",\"function\":\"purgeStockroomPreview\"},\"classification\":\"review-required\",\"skip\":false,\"reason\":\"UNRESOLVED\",\"matched\":{\"file\":\"maintenance.ts\",\"line\":16,\"column\":9,\"revision\":\"10241d647759a95fc149da81fa6f664bd2d1fc51\"}}\n{\"ordinal\":10,\"candidate\":{\"file\":\"maintenance.ts\",\"line\":24,\"column\":9,\"revision\":\"10241d647759a95fc149da81fa6f664bd2d1fc51\",\"kind\":\"execution\",\"function\":\"sendStockroomSnapshot\"},\"classification\":\"unmatched\",\"skip\":false,\"reason\":\"no-execution-match\"}\n",
    "stderr": "",
    "exit_code": 0
  }
}
```

## 16: review / read

Request bytes: 57; response bytes: 565.

```json
{
  "op": "read",
  "file": "maintenance.ts",
  "start": 23,
  "end": 29
}
```
```json
{
  "ok": true,
  "result": {
    "lines": [
      {
        "file": "maintenance.ts",
        "line": 23,
        "text": "export async function sendStockroomSnapshot(db: Db): Promise<void> {"
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
        "text": "    FROM stock_items"
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

## 17: review / finding

Request bytes: 359; response bytes: 43.

```json
{
  "op": "finding",
  "file": "reporting.ts",
  "line": 29,
  "function": "searchStockroom",
  "mechanism": "UntrustedInput phrase is concatenated directly into an ILIKE SQL string, allowing quote/operator injection before db.query executes it.",
  "impact": "Attacker-controlled input can alter the WHERE clause and injected SQL syntax executes through the database query driver."
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

## 18: review / finish

Request bytes: 1167; response bytes: 43.

```json
{
  "op": "finish",
  "dispositions": [
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
      "resolution": "unsafe: untrusted phrase concatenated into SQL text before execution"
    },
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
      "resolution": "safe: static SQL template contains no untrusted input"
    },
    {
      "file": "maintenance.ts",
      "line": 24,
      "column": 9,
      "resolution": "safe: static SQL template contains no untrusted input; handoff unmatched but source confirms constant SQL"
    }
  ],
  "limits": "Reviewed all discovered SQL execution sites under revision 10241d647759a95fc149da81fa6f664bd2d1fc51; no business-semantic, authorization, performance, or SQL-validity analysis performed."
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
