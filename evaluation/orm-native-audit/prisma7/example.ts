import type { PrismaClient } from './generated/index.js';
import { sql, bind } from '../../../dist/index.js';
export async function find(db:PrismaClient,id:number) {
 const q=bind(sql`SELECT id FROM items WHERE id=:id`,{id},'anonymous');
 const rows=await db.$queryRawUnsafe<{id:number}[]>(q.text,...q.values);
 await db.$transaction(tx=>tx.$queryRawUnsafe(q.text,...q.values));
 return rows;
}
