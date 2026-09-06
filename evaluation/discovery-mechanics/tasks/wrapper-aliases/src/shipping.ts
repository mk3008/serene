import type { Driver } from "./contracts";
import { arrive, lookupDock, watchRows } from "./access";

export async function receive(driver: Driver, shipmentId: string) {
  return arrive(driver, shipmentId);
}

export async function dockBoard(driver: Driver, dock: string) {
  return lookupDock(driver, dock);
}

export function followLateShipments(driver: Driver) {
  return watchRows(driver, "select id from shipments where late = 1", []);
}
