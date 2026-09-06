import { bind, sql } from '@mk3008/serene';

export async function loadUser(db: { query(text: string, values: unknown[]): Promise<unknown> }, id: string) {
  const statement = sql`SELECT id, email FROM users WHERE id = :id`;
  const query = bind(statement, { id }, 'indexed');
  return db.query(query.text, query.values);
}
