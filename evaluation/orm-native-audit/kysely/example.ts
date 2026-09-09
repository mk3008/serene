import { Kysely, CompiledQuery } from 'kysely';
import { sql, bind } from '../../../dist/index.js';
export async function find(db: Kysely<{}>, id: number) {
  const q = bind(sql`SELECT id FROM items WHERE id = :id`, { id }, 'indexed');
  return db.executeQuery<{ id: number }>(CompiledQuery.raw(q.text, [...q.values]));
}
