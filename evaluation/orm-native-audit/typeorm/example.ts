import type { DataSource, EntityManager, QueryRunner } from 'typeorm';
import { sql, bind } from '../../../dist/index.js';
export async function find(ds: DataSource, manager: EntityManager, runner: QueryRunner, id: number) {
 const q=bind(sql`SELECT id FROM items WHERE id=:id`,{id},'anonymous');
 await ds.query(q.text,q.values);
 await manager.query(q.text,q.values);
 await runner.query(q.text,q.values);
}
