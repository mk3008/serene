import type { Driver } from "./contracts";
import { dispatch, fetchRows } from "./access";

export async function closeOrder(driver: Driver, orderId: string) {
  return dispatch(driver, "update orders set closed = 1 where id = ?", [orderId]);
}

export async function ordersFor(driver: Driver, accountId: string) {
  return fetchRows(driver, "select id, total from orders where account_id = ?", [accountId]);
}
