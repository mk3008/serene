import type { Driver } from "./contracts";

export async function writeRecord(driver: Driver, text: string, values: readonly unknown[]) {
  return driver.execute(text, values);
}

export async function readRecords(driver: Driver, text: string, values: readonly unknown[]) {
  return driver.query(text, values);
}

export function openFeed(driver: Driver, text: string, values: readonly unknown[]) {
  return driver.stream(text, values);
}
