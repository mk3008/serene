export interface Db {
  query(text: string, values?: Readonly<Record<string, unknown>>): Promise<void>;
  execute(text: string, values?: Readonly<Record<string, unknown>>): Promise<void>;
  sendSql(text: string): Promise<void>;
}

/** Values with this type came directly from an HTTP request. */
export type UntrustedInput = string;
