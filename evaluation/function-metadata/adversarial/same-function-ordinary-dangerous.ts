import { bind, sql } from '@mk3008/serene';

export async function loadAndSearch(db: { query(text: string, values?: unknown[]): Promise<unknown> }, id: string, term: string) {
  const statement = sql`SELECT id FROM users WHERE id = :id`;
  const query = bind(statement, { id }, 'indexed');
  await db.query(query.text, query.values);
  return db.query('SELECT id FROM users WHERE name = ' + term);
}
