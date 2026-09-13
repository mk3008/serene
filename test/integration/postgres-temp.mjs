import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { sql, bind, materializeTemp } from '@mk3008/serene';

// Deliberately fail rather than silently skip the real-database acceptance gate.
assert.ok(process.env.DATABASE_URL, 'Set DATABASE_URL to run PostgreSQL regression');
test('TEMP materialization binds, consumes and disappears on commit and rollback', async () => {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    for (const end of ['COMMIT', 'ROLLBACK']) {
      await client.query('BEGIN');
      const payload = "'; DROP TABLE unrelated; --";
      const body = sql`SELECT :id::int AS id, :id::int AS repeated, :note::text AS note, ARRAY[:id::int] AS items`;
      const query = bind(materializeTemp(body, 'serene_snapshot'), { id: 42, note: payload }, 'indexed');
      await client.query(query.text, query.values);
      const read = bind(sql`SELECT id, repeated, note, items FROM pg_temp.serene_snapshot WHERE id = :id`, { id: 42 }, 'indexed');
      assert.deepEqual((await client.query(read.text, read.values)).rows,
        [{ id: 42, repeated: 42, note: payload, items: [42] }]);
      await client.query(end);
      assert.equal((await client.query("SELECT to_regclass('pg_temp.serene_snapshot') AS name")).rows[0].name, null);
    }
    await client.query('BEGIN');
    await client.query(bind(materializeTemp(sql`SELECT 1 AS id`, 'serene_snapshot')));
    await assert.rejects(client.query('SELECT 1 / 0'), error => error.code === '22012');
    await client.query('ROLLBACK');
    assert.equal((await client.query("SELECT to_regclass('pg_temp.serene_snapshot') AS name")).rows[0].name, null);
  } finally { await client.end(); }
});
