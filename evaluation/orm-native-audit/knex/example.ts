import type {Knex} from 'knex';
import {sql,bind} from '../../../dist/index.js';
export async function find(db:Knex,id:number) {
 const q=bind(sql`SELECT id FROM items WHERE id=:id`,{id},'anonymous');
 const rows=await db.raw(q.text,q.values);
 await db.transaction(trx=>trx.raw(q.text,q.values));
 return rows;
}
