# sr recorded trajectory

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
    "revision": "7d582822ae9cdb9f2c5f5f9ad8f69c8854518c8a",
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

Request bytes: 80; response bytes: 40.

```json
{
  "op": "search",
  "pattern": "Db\\.(query|execute|sendSql)",
  "file": "maintenance.ts"
}
```
```json
{
  "ok": true,
  "result": {
    "matches": []
  }
}
```

## 4: discovery / search

Request bytes: 79; response bytes: 40.

```json
{
  "op": "search",
  "pattern": "Db\\.(query|execute|sendSql)",
  "file": "operations.ts"
}
```
```json
{
  "ok": true,
  "result": {
    "matches": []
  }
}
```

## 5: discovery / search

Request bytes: 78; response bytes: 40.

```json
{
  "op": "search",
  "pattern": "Db\\.(query|execute|sendSql)",
  "file": "reporting.ts"
}
```
```json
{
  "ok": true,
  "result": {
    "matches": []
  }
}
```

## 6: discovery / search

Request bytes: 78; response bytes: 40.

```json
{
  "op": "search",
  "pattern": "Db\\.(query|execute|sendSql)",
  "file": "contracts.ts"
}
```
```json
{
  "ok": true,
  "result": {
    "matches": []
  }
}
```

## 7: discovery / search

Request bytes: 73; response bytes: 298.

```json
{
  "op": "search",
  "pattern": "query|execute|sendSql",
  "file": "maintenance.ts"
}
```
```json
{
  "ok": true,
  "result": {
    "matches": [
      {
        "file": "maintenance.ts",
        "line": 10,
        "text": "  await db.execute(statement, { quantity: quantity, sku: sku });"
      },
      {
        "file": "maintenance.ts",
        "line": 14,
        "text": "  await db.execute(`"
      },
      {
        "file": "maintenance.ts",
        "line": 22,
        "text": "  await db.sendSql(`"
      }
    ]
  }
}
```

## 8: discovery / search

Request bytes: 71; response bytes: 322.

```json
{
  "op": "search",
  "pattern": "query|execute|sendSql",
  "file": "reporting.ts"
}
```
```json
{
  "ok": true,
  "result": {
    "matches": [
      {
        "file": "reporting.ts",
        "line": 10,
        "text": "  await db.query(statement, { supplierId: supplierId });"
      },
      {
        "file": "reporting.ts",
        "line": 20,
        "text": "  await db.query(statement, { minimum: minimum });"
      },
      {
        "file": "reporting.ts",
        "line": 29,
        "text": "  await db.query(statement);"
      }
    ]
  }
}
```

## 9: discovery / search

Request bytes: 72; response bytes: 452.

```json
{
  "op": "search",
  "pattern": "query|execute|sendSql",
  "file": "operations.ts"
}
```
```json
{
  "ok": true,
  "result": {
    "matches": [
      {
        "file": "operations.ts",
        "line": 10,
        "text": "  await db.query(statement, {});"
      },
      {
        "file": "operations.ts",
        "line": 20,
        "text": "  await db.query(statement, { binCode: binCode });"
      },
      {
        "file": "operations.ts",
        "line": 30,
        "text": "  await db.execute(statement, { quantity: quantity, sku: sku });"
      },
      {
        "file": "operations.ts",
        "line": 40,
        "text": "  await db.execute(statement, { quantity: quantity, sku: sku });"
      }
    ]
  }
}
```

## 10: discovery / search

Request bytes: 71; response bytes: 388.

```json
{
  "op": "search",
  "pattern": "query|execute|sendSql",
  "file": "contracts.ts"
}
```
```json
{
  "ok": true,
  "result": {
    "matches": [
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

## 11: discovery / read

Request bytes: 35; response bytes: 2348.

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
        "text": "import type { Db, UntrustedInput } from './contracts.js';"
      },
      {
        "file": "reporting.ts",
        "line": 2,
        "text": ""
      },
      {
        "file": "reporting.ts",
        "line": 3,
        "text": "export async function loadSupplierItems(db: Db, supplierId: string): Promise<void> {"
      },
      {
        "file": "reporting.ts",
        "line": 4,
        "text": "  const statement = `"
      },
      {
        "file": "reporting.ts",
        "line": 5,
        "text": "    SELECT sku, item_name, supplier_id"
      },
      {
        "file": "reporting.ts",
        "line": 6,
        "text": "    FROM stock_items"
      },
      {
        "file": "reporting.ts",
        "line": 7,
        "text": "    WHERE supplier_id = :supplierId"
      },
      {
        "file": "reporting.ts",
        "line": 8,
        "text": "    ORDER BY item_name"
      },
      {
        "file": "reporting.ts",
        "line": 9,
        "text": "  `;"
      },
      {
        "file": "reporting.ts",
        "line": 10,
        "text": "  await db.query(statement, { supplierId: supplierId });"
      },
      {
        "file": "reporting.ts",
        "line": 11,
        "text": "}"
      },
      {
        "file": "reporting.ts",
        "line": 12,
        "text": ""
      },
      {
        "file": "reporting.ts",
        "line": 13,
        "text": "export async function countItemsByZone(db: Db, minimum: string): Promise<void> {"
      },
      {
        "file": "reporting.ts",
        "line": 14,
        "text": "  const statement = `"
      },
      {
        "file": "reporting.ts",
        "line": 15,
        "text": "    SELECT zone, COUNT(*) AS total"
      },
      {
        "file": "reporting.ts",
        "line": 16,
        "text": "    FROM bin_balances"
      },
      {
        "file": "reporting.ts",
        "line": 17,
        "text": "    WHERE quantity > :minimum"
      },
      {
        "file": "reporting.ts",
        "line": 18,
        "text": "    GROUP BY zone"
      },
      {
        "file": "reporting.ts",
        "line": 19,
        "text": "  `;"
      },
      {
        "file": "reporting.ts",
        "line": 20,
        "text": "  await db.query(statement, { minimum: minimum });"
      },
      {
        "file": "reporting.ts",
        "line": 21,
        "text": "}"
      },
      {
        "file": "reporting.ts",
        "line": 22,
        "text": ""
      },
      {
        "file": "reporting.ts",
        "line": 23,
        "text": "export async function searchStockroom(db: Db, phrase: UntrustedInput): Promise<void> {"
      },
      {
        "file": "reporting.ts",
        "line": 24,
        "text": "  const statement = `"
      },
      {
        "file": "reporting.ts",
        "line": 25,
        "text": "    SELECT id, item_name"
      },
      {
        "file": "reporting.ts",
        "line": 26,
        "text": "    FROM stockroom"
      },
      {
        "file": "reporting.ts",
        "line": 27,
        "text": "    WHERE item_name ILIKE '%` + phrase + `%'"
      },
      {
        "file": "reporting.ts",
        "line": 28,
        "text": "  `;"
      },
      {
        "file": "reporting.ts",
        "line": 29,
        "text": "  await db.query(statement);"
      },
      {
        "file": "reporting.ts",
        "line": 30,
        "text": "}"
      }
    ]
  }
}
```

## 12: discovery / read

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

## 13: discovery / read

Request bytes: 37; response bytes: 2121.

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
        "text": "import type { Db, UntrustedInput } from './contracts.js';"
      },
      {
        "file": "maintenance.ts",
        "line": 2,
        "text": ""
      },
      {
        "file": "maintenance.ts",
        "line": 3,
        "text": "export async function receiveShipment(db: Db, quantity: string, sku: string): Promise<void> {"
      },
      {
        "file": "maintenance.ts",
        "line": 4,
        "text": "  const statement = `"
      },
      {
        "file": "maintenance.ts",
        "line": 5,
        "text": "    UPDATE stock_items"
      },
      {
        "file": "maintenance.ts",
        "line": 6,
        "text": "    SET on_hand = on_hand + :quantity"
      },
      {
        "file": "maintenance.ts",
        "line": 7,
        "text": "    WHERE sku = :sku"
      },
      {
        "file": "maintenance.ts",
        "line": 8,
        "text": "    RETURNING on_hand"
      },
      {
        "file": "maintenance.ts",
        "line": 9,
        "text": "  `;"
      },
      {
        "file": "maintenance.ts",
        "line": 10,
        "text": "  await db.execute(statement, { quantity: quantity, sku: sku });"
      },
      {
        "file": "maintenance.ts",
        "line": 11,
        "text": "}"
      },
      {
        "file": "maintenance.ts",
        "line": 12,
        "text": ""
      },
      {
        "file": "maintenance.ts",
        "line": 13,
        "text": "export async function purgeStockroomPreview(db: Db): Promise<void> {"
      },
      {
        "file": "maintenance.ts",
        "line": 14,
        "text": "  await db.execute(`"
      },
      {
        "file": "maintenance.ts",
        "line": 15,
        "text": "    DELETE FROM stock_items_preview"
      },
      {
        "file": "maintenance.ts",
        "line": 16,
        "text": "    WHERE expires_at < CURRENT_TIMESTAMP"
      },
      {
        "file": "maintenance.ts",
        "line": 17,
        "text": "    RETURNING id"
      },
      {
        "file": "maintenance.ts",
        "line": 18,
        "text": "  `);"
      },
      {
        "file": "maintenance.ts",
        "line": 19,
        "text": "}"
      },
      {
        "file": "maintenance.ts",
        "line": 20,
        "text": ""
      },
      {
        "file": "maintenance.ts",
        "line": 21,
        "text": "export async function sendStockroomSnapshot(db: Db): Promise<void> {"
      },
      {
        "file": "maintenance.ts",
        "line": 22,
        "text": "  await db.sendSql(`"
      },
      {
        "file": "maintenance.ts",
        "line": 23,
        "text": "    SELECT id, created_at"
      },
      {
        "file": "maintenance.ts",
        "line": 24,
        "text": "    FROM stock_items"
      },
      {
        "file": "maintenance.ts",
        "line": 25,
        "text": "    WHERE archived = false"
      },
      {
        "file": "maintenance.ts",
        "line": 26,
        "text": "  `);"
      },
      {
        "file": "maintenance.ts",
        "line": 27,
        "text": "}"
      }
    ]
  }
}
```

## 14: discovery / read

Request bytes: 36; response bytes: 3216.

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
        "text": "import type { Db, UntrustedInput } from './contracts.js';"
      },
      {
        "file": "operations.ts",
        "line": 2,
        "text": ""
      },
      {
        "file": "operations.ts",
        "line": 3,
        "text": "export async function listReorderItems(db: Db): Promise<void> {"
      },
      {
        "file": "operations.ts",
        "line": 4,
        "text": "  const statement = `"
      },
      {
        "file": "operations.ts",
        "line": 5,
        "text": "    SELECT sku, item_name, on_hand"
      },
      {
        "file": "operations.ts",
        "line": 6,
        "text": "    FROM stock_items"
      },
      {
        "file": "operations.ts",
        "line": 7,
        "text": "    WHERE on_hand <= reorder_point"
      },
      {
        "file": "operations.ts",
        "line": 8,
        "text": "    ORDER BY sku"
      },
      {
        "file": "operations.ts",
        "line": 9,
        "text": "  `;"
      },
      {
        "file": "operations.ts",
        "line": 10,
        "text": "  await db.query(statement, {});"
      },
      {
        "file": "operations.ts",
        "line": 11,
        "text": "}"
      },
      {
        "file": "operations.ts",
        "line": 12,
        "text": ""
      },
      {
        "file": "operations.ts",
        "line": 13,
        "text": "export async function findBinBalance(db: Db, binCode: string): Promise<void> {"
      },
      {
        "file": "operations.ts",
        "line": 14,
        "text": "  const statement = `"
      },
      {
        "file": "operations.ts",
        "line": 15,
        "text": "    SELECT bin_code, sku, quantity"
      },
      {
        "file": "operations.ts",
        "line": 16,
        "text": "    FROM bin_balances"
      },
      {
        "file": "operations.ts",
        "line": 17,
        "text": "    WHERE bin_code = :binCode"
      },
      {
        "file": "operations.ts",
        "line": 18,
        "text": "    ORDER BY sku"
      },
      {
        "file": "operations.ts",
        "line": 19,
        "text": "  `;"
      },
      {
        "file": "operations.ts",
        "line": 20,
        "text": "  await db.query(statement, { binCode: binCode });"
      },
      {
        "file": "operations.ts",
        "line": 21,
        "text": "}"
      },
      {
        "file": "operations.ts",
        "line": 22,
        "text": ""
      },
      {
        "file": "operations.ts",
        "line": 23,
        "text": "export async function reserveStock(db: Db, quantity: string, sku: string): Promise<void> {"
      },
      {
        "file": "operations.ts",
        "line": 24,
        "text": "  const statement = `"
      },
      {
        "file": "operations.ts",
        "line": 25,
        "text": "    UPDATE stock_items"
      },
      {
        "file": "operations.ts",
        "line": 26,
        "text": "    SET reserved = reserved + :quantity"
      },
      {
        "file": "operations.ts",
        "line": 27,
        "text": "    WHERE sku = :sku"
      },
      {
        "file": "operations.ts",
        "line": 28,
        "text": "    RETURNING sku"
      },
      {
        "file": "operations.ts",
        "line": 29,
        "text": "  `;"
      },
      {
        "file": "operations.ts",
        "line": 30,
        "text": "  await db.execute(statement, { quantity: quantity, sku: sku });"
      },
      {
        "file": "operations.ts",
        "line": 31,
        "text": "}"
      },
      {
        "file": "operations.ts",
        "line": 32,
        "text": ""
      },
      {
        "file": "operations.ts",
        "line": 33,
        "text": "export async function releaseReservation(db: Db, quantity: string, sku: string): Promise<void> {"
      },
      {
        "file": "operations.ts",
        "line": 34,
        "text": "  const statement = `"
      },
      {
        "file": "operations.ts",
        "line": 35,
        "text": "    UPDATE stock_items"
      },
      {
        "file": "operations.ts",
        "line": 36,
        "text": "    SET reserved = reserved - :quantity"
      },
      {
        "file": "operations.ts",
        "line": 37,
        "text": "    WHERE sku = :sku"
      },
      {
        "file": "operations.ts",
        "line": 38,
        "text": "    RETURNING sku"
      },
      {
        "file": "operations.ts",
        "line": 39,
        "text": "  `;"
      },
      {
        "file": "operations.ts",
        "line": 40,
        "text": "  await db.execute(statement, { quantity: quantity, sku: sku });"
      },
      {
        "file": "operations.ts",
        "line": 41,
        "text": "}"
      }
    ]
  }
}
```

## 15: discovery / discover

Request bytes: 1523; response bytes: 66.

```json
{
  "op": "discover",
  "candidates": [
    {
      "file": "operations.ts",
      "line": 10,
      "column": 9,
      "revision": "7d582822ae9cdb9f2c5f5f9ad8f69c8854518c8a",
      "kind": "execution",
      "function": "listReorderItems"
    },
    {
      "file": "operations.ts",
      "line": 20,
      "column": 9,
      "revision": "7d582822ae9cdb9f2c5f5f9ad8f69c8854518c8a",
      "kind": "execution",
      "function": "findBinBalance"
    },
    {
      "file": "operations.ts",
      "line": 30,
      "column": 9,
      "revision": "7d582822ae9cdb9f2c5f9ad8f69c8854518c8a",
      "kind": "execution",
      "function": "reserveStock"
    },
    {
      "file": "operations.ts",
      "line": 40,
      "column": 9,
      "revision": "7d582822ae9cdb9f2c5f5f9ad8f69c8854518c8a",
      "kind": "execution",
      "function": "releaseReservation"
    },
    {
      "file": "maintenance.ts",
      "line": 10,
      "column": 9,
      "revision": "7d582822ae9cdb9f2c5f9ad8f69c8854518c8a",
      "kind": "execution",
      "function": "receiveShipment"
    },
    {
      "file": "maintenance.ts",
      "line": 14,
      "column": 9,
      "revision": "7d582822ae9cdb9f2c5f5f9ad8f69c8854518c8a",
      "kind": "execution",
      "function": "purgeStockroomPreview"
    },
    {
      "file": "maintenance.ts",
      "line": 22,
      "column": 9,
      "revision": "7d582822ae9cdb9f2c5f5f9ad8f69c8854518c8a",
      "kind": "execution",
      "function": "sendStockroomSnapshot"
    },
    {
      "file": "reporting.ts",
      "line": 10,
      "column": 9,
      "revision": "7d582822ae9cdb9f2c5f5f9ad8f69c8854518c8a",
      "kind": "execution",
      "function": "loadSupplierItems"
    },
    {
      "file": "reporting.ts",
      "line": 20,
      "column": 9,
      "revision": "7d582822ae9cdb9f2c5f5f9ad8f69c8854518c8a",
      "kind": "execution",
      "function": "countItemsByZone"
    },
    {
      "file": "reporting.ts",
      "line": 29,
      "column": 9,
      "revision": "7d582822ae9cdb9f2c5f5f9ad8f69c8854518c8a",
      "kind": "execution",
      "function": "searchStockroom"
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

## 16: review / finding

Request bytes: 407; response bytes: 43.

```json
{
  "op": "finding",
  "file": "reporting.ts",
  "line": 27,
  "function": "searchStockroom",
  "mechanism": "UntrustedInput phrase is concatenated directly into the SQL ILIKE string literal, allowing input to break out of the quoted pattern and inject SQL syntax.",
  "impact": "An HTTP-controlled phrase can alter the query text executed by db.query, enabling injected predicates or additional SQL depending on driver behavior."
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

## 17: review / finish

Request bytes: 1055; response bytes: 43.

```json
{
  "op": "finish",
  "dispositions": [
    {
      "file": "operations.ts",
      "line": 10,
      "column": 9,
      "resolution": "safe-constant-statement"
    },
    {
      "file": "operations.ts",
      "line": 20,
      "column": 9,
      "resolution": "safe-parameterized-input"
    },
    {
      "file": "operations.ts",
      "line": 30,
      "column": 9,
      "resolution": "safe-parameterized-input"
    },
    {
      "file": "operations.ts",
      "line": 40,
      "column": 9,
      "resolution": "safe-parameterized-input"
    },
    {
      "file": "maintenance.ts",
      "line": 10,
      "column": 9,
      "resolution": "safe-parameterized-input"
    },
    {
      "file": "maintenance.ts",
      "line": 14,
      "column": 9,
      "resolution": "safe-constant-statement"
    },
    {
      "file": "maintenance.ts",
      "line": 22,
      "column": 9,
      "resolution": "safe-constant-statement"
    },
    {
      "file": "reporting.ts",
      "line": 10,
      "column": 9,
      "resolution": "safe-parameterized-input"
    },
    {
      "file": "reporting.ts",
      "line": 20,
      "column": 9,
      "resolution": "safe-parameterized-input"
    },
    {
      "file": "reporting.ts",
      "line": 29,
      "column": 9,
      "resolution": "unsafe-untrusted-concatenation"
    }
  ],
  "limits": "Reviewed all 10 discovered Db execution sites across the repository; conclusions are based on the source and README contracts available in this run."
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
