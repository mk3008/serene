export interface SqlPool {
  query(statement: string, values?: readonly unknown[]): Promise<unknown[]>;
  execute(statement: string, values?: readonly unknown[]): Promise<{ changed: number }>;
  prepare(statement: string): PreparedStatement;
}

export interface SqlClient {
  query(statement: string, values?: readonly unknown[]): Promise<unknown[]>;
  execute(statement: string, values?: readonly unknown[]): Promise<{ changed: number }>;
}

export interface PreparedStatement {
  describe(): { text: string };
}

export interface BatchDriver {
  batch(statements: readonly { text: string; values: readonly unknown[] }[]): Promise<void>;
}

export type InventoryRow = {
  sku: string;
  title: string;
};

export type ReceiptRow = {
  id: string;
  total: number;
};

export function isInventoryRow(value: unknown): value is InventoryRow {
  return typeof value === "object" && value !== null && "sku" in value && "title" in value;
}

export function isReceiptRow(value: unknown): value is ReceiptRow {
  return typeof value === "object" && value !== null && "id" in value && "total" in value;
}
