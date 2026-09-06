# d2 command trajectory

Command argv and output (trailing whitespace trimmed for display); unabridged machine records and snapshots are in the adjacent JSONL.

## Event 1 — exec

```json
["bash", "-lc", "pwd; ls -la; if [ -f README.md ]; then cat README.md; elif [ -f readme.md ]; then cat readme.md; fi"]
```
```text
/tmp/serene-discovery-mechanics/repos/d2
total 20
drwxr-xr-x 4 root root 4096 Sep  7 04:18 .
drwxr-xr-x 5 root root 4096 Sep  7 04:18 ..
drwxr-xr-x 7 root root 4096 Sep  7 04:18 .git
-rw-r--r-- 1 root root  385 Sep  7 04:16 README.md
drwxr-xr-x 2 root root 4096 Sep  7 04:11 src
# Wrapper aliases

`src/main.ts` starts a fulfillment workflow. A host supplies the `Driver` interface
from `src/contracts.ts`; this repository provides no driver implementation. `query`, `execute`, and
`stream` run statements when called; `prepare` returns metadata without executing. The application routes database
work through gateway functions, including their re-exported names.


```

## Event 2 — exec

```json
["bash", "-lc", "rg --files src | sort; for f in $(rg --files src | sort); do echo ===$f===; nl -ba \"$f\"; done"]
```
```text
src/access.ts
src/contracts.ts
src/gateway.ts
src/main.ts
src/notes.ts
src/orders.ts
src/shipping.ts
src/warehouseGateway.ts
===src/access.ts===
     1	export { openFeed as watchRows, readRecords as fetchRows, writeRecord as dispatch } from "./gateway";
     2	export { findDock as lookupDock, recordArrival as arrive } from "./warehouseGateway";
===src/contracts.ts===
     1	export interface Driver {
     2	  query(text: string, values?: readonly unknown[]): Promise<unknown[]>;
     3	  execute(text: string, values?: readonly unknown[]): Promise<{ rows: number }>;
     4	  stream(text: string, values?: readonly unknown[]): AsyncIterable<unknown>;
     5	  prepare(text: string): { label: string };
     6	}
     7
     8	export type Shipment = {
     9	  id: string;
    10	  dock: string;
    11	  carrier: string;
    12	};
    13
    14	export function isShipment(value: unknown): value is Shipment {
    15	  return typeof value === "object" && value !== null && "id" in value && "dock" in value;
    16	}
    17
    18	export type OrderStatus = "open" | "closed";
    19
    20	export function orderStatusLabel(status: OrderStatus) {
    21	  return status === "closed" ? "Closed order" : "Open order";
    22	}
===src/gateway.ts===
     1	import type { Driver } from "./contracts";
     2
     3	export async function writeRecord(driver: Driver, text: string, values: readonly unknown[]) {
     4	  return driver.execute(text, values);
     5	}
     6
     7	export async function readRecords(driver: Driver, text: string, values: readonly unknown[]) {
     8	  return driver.query(text, values);
     9	}
    10
    11	export function openFeed(driver: Driver, text: string, values: readonly unknown[]) {
    12	  return driver.stream(text, values);
    13	}
===src/main.ts===
     1	import type { Driver } from "./contracts";
     2	import { closeOrder, ordersFor } from "./orders";
     3	import { dockBoard, followLateShipments, receive } from "./shipping";
     4
     5	export async function runFulfillment(driver: Driver) {
     6	  await closeOrder(driver, "O-8");
     7	  await ordersFor(driver, "A-2");
     8	  await receive(driver, "S-9");
     9	  await dockBoard(driver, "west");
    10	  return followLateShipments(driver);
    11	}
===src/notes.ts===
     1	import type { Driver } from "./contracts";
     2
     3	export const shipmentQueryLabel = "shipment query";
     4
     5	export function previewPlan(driver: Driver) {
     6	  return driver.prepare("select id from shipments where dock = ?");
     7	}
     8
     9	export function renderSqlBadge(text: string) {
    10	  return `SQL: ${text}`;
    11	}
    12
    13	export interface DockNote {
    14	  dock: string;
    15	  message: string;
    16	  createdAt: string;
    17	}
    18
    19	export function makeDockNote(dock: string, message: string, createdAt: Date): DockNote {
    20	  return { dock: dock.trim(), message: message.trim(), createdAt: createdAt.toISOString() };
    21	}
    22
    23	export function describeDockNote(note: DockNote) {
    24	  return `${note.dock}: ${note.message}`;
    25	}
    26
    27	export function groupNotes(notes: readonly DockNote[]) {
    28	  return notes.reduce<Record<string, DockNote[]>>((groups, note) => {
    29	    (groups[note.dock] ??= []).push(note);
    30	    return groups;
    31	  }, {});
    32	}
    33
    34	export function latestNote(notes: readonly DockNote[]) {
    35	  return notes.at(-1);
    36	}
    37
    38	export const dockBoardColumns = ["dock", "carrier", "arrival"];
    39
    40	export function isLateLabel(label: string) {
    41	  return label.toLowerCase().includes("late");
    42	}
    43
    44	export function readFilterFromHash(hash: string) {
    45	  return hash.replace(/^#/, "").split("=")[1] ?? "";
    46	}
    47
    48	export function deliveryStatusLabel(closed: boolean) {
    49	  return closed ? "closed" : "open";
    50	}
===src/orders.ts===
     1	import type { Driver } from "./contracts";
     2	import { dispatch, fetchRows } from "./access";
     3
     4	export async function closeOrder(driver: Driver, orderId: string) {
     5	  return dispatch(driver, "update orders set closed = 1 where id = ?", [orderId]);
     6	}
     7
     8	export async function ordersFor(driver: Driver, accountId: string) {
     9	  return fetchRows(driver, "select id, total from orders where account_id = ?", [accountId]);
    10	}
===src/shipping.ts===
     1	import type { Driver } from "./contracts";
     2	import { arrive, lookupDock, watchRows } from "./access";
     3
     4	export async function receive(driver: Driver, shipmentId: string) {
     5	  return arrive(driver, shipmentId);
     6	}
     7
     8	export async function dockBoard(driver: Driver, dock: string) {
     9	  return lookupDock(driver, dock);
    10	}
    11
    12	export function followLateShipments(driver: Driver) {
    13	  return watchRows(driver, "select id from shipments where late = 1", []);
    14	}
===src/warehouseGateway.ts===
     1	import type { Driver } from "./contracts";
     2
     3	export async function recordArrival(driver: Driver, shipmentId: string) {
     4	  return driver.execute("update shipments set arrived_at = current_timestamp where id = ?", [shipmentId]);
     5	}
     6
     7	export async function findDock(driver: Driver, dock: string) {
     8	  return driver.query("select id, carrier from shipments where dock = ?", [dock]);
     9	}


```

## Event 3 — exec

```json
["rg", "-n", "driver\\.(query|execute|stream|prepare)|export \\{.*from", "src"]
```
```text
src/gateway.ts:4:  return driver.execute(text, values);
src/gateway.ts:8:  return driver.query(text, values);
src/gateway.ts:12:  return driver.stream(text, values);
src/access.ts:1:export { openFeed as watchRows, readRecords as fetchRows, writeRecord as dispatch } from "./gateway";
src/access.ts:2:export { findDock as lookupDock, recordArrival as arrive } from "./warehouseGateway";
src/notes.ts:6:  return driver.prepare("select id from shipments where dock = ?");
src/warehouseGateway.ts:4:  return driver.execute("update shipments set arrived_at = current_timestamp where id = ?", [shipmentId]);
src/warehouseGateway.ts:8:  return driver.query("select id, carrier from shipments where dock = ?", [dock]);


```

## Event 4 — snapshot

```json
{
  "candidates": [
    {
      "file": "src/gateway.ts",
      "line": 4,
      "function": "writeRecord",
      "status": "confirmed",
      "evidence": "event 2 source listing and event 3 direct driver.execute match"
    },
    {
      "file": "src/gateway.ts",
      "line": 8,
      "function": "readRecords",
      "status": "confirmed",
      "evidence": "event 2 source listing and event 3 direct driver.query match"
    },
    {
      "file": "src/gateway.ts",
      "line": 12,
      "function": "openFeed",
      "status": "confirmed",
      "evidence": "event 2 source listing and event 3 direct driver.stream match"
    },
    {
      "file": "src/warehouseGateway.ts",
      "line": 4,
      "function": "recordArrival",
      "status": "confirmed",
      "evidence": "event 2 source listing and event 3 direct driver.execute match"
    },
    {
      "file": "src/warehouseGateway.ts",
      "line": 8,
      "function": "findDock",
      "status": "confirmed",
      "evidence": "event 2 source listing and event 3 direct driver.query match"
    }
  ],
  "added": [
    {
      "file": "src/gateway.ts",
      "line": 4,
      "function": "writeRecord",
      "status": "confirmed",
      "evidence": "event 2 source listing and event 3 direct driver.execute match"
    },
    {
      "file": "src/gateway.ts",
      "line": 8,
      "function": "readRecords",
      "status": "confirmed",
      "evidence": "event 2 source listing and event 3 direct driver.query match"
    },
    {
      "file": "src/gateway.ts",
      "line": 12,
      "function": "openFeed",
      "status": "confirmed",
      "evidence": "event 2 source listing and event 3 direct driver.stream match"
    },
    {
      "file": "src/warehouseGateway.ts",
      "line": 4,
      "function": "recordArrival",
      "status": "confirmed",
      "evidence": "event 2 source listing and event 3 direct driver.execute match"
    },
    {
      "file": "src/warehouseGateway.ts",
      "line": 8,
      "function": "findDock",
      "status": "confirmed",
      "evidence": "event 2 source listing and event 3 direct driver.query match"
    }
  ],
  "removed": [],
  "updated": []
}
```

## Event 5 — exec

```json
["rg", "-n", "writeRecord|readRecords|openFeed|recordArrival|findDock|dispatch|fetchRows|watchRows|arrive|lookupDock|runFulfillment|closeOrder|ordersFor|receive|dockBoard|followLateShipments", "src"]
```
```text
src/gateway.ts:3:export async function writeRecord(driver: Driver, text: string, values: readonly unknown[]) {
src/gateway.ts:7:export async function readRecords(driver: Driver, text: string, values: readonly unknown[]) {
src/gateway.ts:11:export function openFeed(driver: Driver, text: string, values: readonly unknown[]) {
src/main.ts:2:import { closeOrder, ordersFor } from "./orders";
src/main.ts:3:import { dockBoard, followLateShipments, receive } from "./shipping";
src/main.ts:5:export async function runFulfillment(driver: Driver) {
src/main.ts:6:  await closeOrder(driver, "O-8");
src/main.ts:7:  await ordersFor(driver, "A-2");
src/main.ts:8:  await receive(driver, "S-9");
src/main.ts:9:  await dockBoard(driver, "west");
src/main.ts:10:  return followLateShipments(driver);
src/access.ts:1:export { openFeed as watchRows, readRecords as fetchRows, writeRecord as dispatch } from "./gateway";
src/access.ts:2:export { findDock as lookupDock, recordArrival as arrive } from "./warehouseGateway";
src/orders.ts:2:import { dispatch, fetchRows } from "./access";
src/orders.ts:4:export async function closeOrder(driver: Driver, orderId: string) {
src/orders.ts:5:  return dispatch(driver, "update orders set closed = 1 where id = ?", [orderId]);
src/orders.ts:8:export async function ordersFor(driver: Driver, accountId: string) {
src/orders.ts:9:  return fetchRows(driver, "select id, total from orders where account_id = ?", [accountId]);
src/notes.ts:38:export const dockBoardColumns = ["dock", "carrier", "arrival"];
src/shipping.ts:2:import { arrive, lookupDock, watchRows } from "./access";
src/shipping.ts:4:export async function receive(driver: Driver, shipmentId: string) {
src/shipping.ts:5:  return arrive(driver, shipmentId);
src/shipping.ts:8:export async function dockBoard(driver: Driver, dock: string) {
src/shipping.ts:9:  return lookupDock(driver, dock);
src/shipping.ts:12:export function followLateShipments(driver: Driver) {
src/shipping.ts:13:  return watchRows(driver, "select id from shipments where late = 1", []);
src/warehouseGateway.ts:3:export async function recordArrival(driver: Driver, shipmentId: string) {
src/warehouseGateway.ts:4:  return driver.execute("update shipments set arrived_at = current_timestamp where id = ?", [shipmentId]);
src/warehouseGateway.ts:7:export async function findDock(driver: Driver, dock: string) {


```

## Event 6 — note

Direct execution sites are the five driver query/execute/stream calls in gateway.ts and warehouseGateway.ts. Wrapper chain observed in event 5: orders.ts, shipping.ts, access.ts, and main.ts call through aliases. notes.ts previewPlan calls driver.prepare at line 6; README says prepare returns metadata without executing, so it is excluded.

## Event 7 — snapshot

```json
{
  "candidates": [
    {
      "file": "src/gateway.ts",
      "line": 4,
      "function": "writeRecord",
      "status": "confirmed",
      "evidence": "events 2,3; direct driver.execute and README execution semantics"
    },
    {
      "file": "src/gateway.ts",
      "line": 8,
      "function": "readRecords",
      "status": "confirmed",
      "evidence": "events 2,3; direct driver.query and README execution semantics"
    },
    {
      "file": "src/gateway.ts",
      "line": 12,
      "function": "openFeed",
      "status": "confirmed",
      "evidence": "events 2,3; direct driver.stream and README execution semantics"
    },
    {
      "file": "src/warehouseGateway.ts",
      "line": 4,
      "function": "recordArrival",
      "status": "confirmed",
      "evidence": "events 2,3; direct driver.execute and README execution semantics"
    },
    {
      "file": "src/warehouseGateway.ts",
      "line": 8,
      "function": "findDock",
      "status": "confirmed",
      "evidence": "events 2,3; direct driver.query and README execution semantics"
    }
  ],
  "added": [],
  "removed": [],
  "updated": [
    {
      "file": "src/gateway.ts",
      "line": 4,
      "function": "writeRecord",
      "status": "confirmed",
      "evidence": "events 2,3; direct driver.execute and README execution semantics"
    },
    {
      "file": "src/gateway.ts",
      "line": 8,
      "function": "readRecords",
      "status": "confirmed",
      "evidence": "events 2,3; direct driver.query and README execution semantics"
    },
    {
      "file": "src/gateway.ts",
      "line": 12,
      "function": "openFeed",
      "status": "confirmed",
      "evidence": "events 2,3; direct driver.stream and README execution semantics"
    },
    {
      "file": "src/warehouseGateway.ts",
      "line": 4,
      "function": "recordArrival",
      "status": "confirmed",
      "evidence": "events 2,3; direct driver.execute and README execution semantics"
    },
    {
      "file": "src/warehouseGateway.ts",
      "line": 8,
      "function": "findDock",
      "status": "confirmed",
      "evidence": "events 2,3; direct driver.query and README execution semantics"
    }
  ]
}
```

## Event 8 — finish

{"ok": true, "finished": true, "candidate_count": 5}
