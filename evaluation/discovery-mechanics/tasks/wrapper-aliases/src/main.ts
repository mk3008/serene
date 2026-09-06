import type { Driver } from "./contracts";
import { closeOrder, ordersFor } from "./orders";
import { dockBoard, followLateShipments, receive } from "./shipping";

export async function runFulfillment(driver: Driver) {
  await closeOrder(driver, "O-8");
  await ordersFor(driver, "A-2");
  await receive(driver, "S-9");
  await dockBoard(driver, "west");
  return followLateShipments(driver);
}
