export interface Driver {
  query(text: string, values?: readonly unknown[]): Promise<unknown[]>;
  execute(text: string, values?: readonly unknown[]): Promise<{ rows: number }>;
  stream(text: string, values?: readonly unknown[]): AsyncIterable<unknown>;
  prepare(text: string): { label: string };
}

export type Shipment = {
  id: string;
  dock: string;
  carrier: string;
};

export function isShipment(value: unknown): value is Shipment {
  return typeof value === "object" && value !== null && "id" in value && "dock" in value;
}

export type OrderStatus = "open" | "closed";

export function orderStatusLabel(status: OrderStatus) {
  return status === "closed" ? "Closed order" : "Open order";
}
