import { Client, Pool, type QueryResult } from 'pg';
import { sql, bind } from '../../../dist/index.js';
export async function check(client: Client, pool: Pool): Promise<void> {
  const q = bind(sql`SELECT :id::int AS id`, { id: 1 }, 'indexed');
  const a: QueryResult<{id: number}> = await client.query<{id: number}>(q);
  const b: QueryResult<{id: number}> = await pool.query<{id: number}>(q);
  const c: QueryResult<{id: number}> = await client.query<{id: number}>({text:q.text,values:q.values});
  const d: QueryResult<{id: number}> = await pool.query<{id: number}>({text:q.text,values:q.values});
  void [a,b,c,d];
}
