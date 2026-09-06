import type { Driver } from "./contracts";

export async function recordArrival(driver: Driver, shipmentId: string) {
  return driver.execute("update shipments set arrived_at = current_timestamp where id = ?", [shipmentId]);
}

export async function findDock(driver: Driver, dock: string) {
  return driver.query("select id, carrier from shipments where dock = ?", [dock]);
}
