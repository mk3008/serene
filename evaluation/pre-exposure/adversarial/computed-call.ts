import { bind, sql } from '@mk3008/serene';

export async function loadComputed(db: Record<string, (text: string, values: unknown[]) => Promise<unknown>>, method: string, id: string) {
  const statement = sql`SELECT id FROM users WHERE id = :id`;
  const query = bind(statement, { id }, 'indexed');
  return db[method](query.text, query.values);
}
