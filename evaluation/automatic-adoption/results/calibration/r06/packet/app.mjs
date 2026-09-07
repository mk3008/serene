import { bind, sql } from '@mk3008/serene';
import { openDatabase } from './database.mjs';

export function openCases() {
 return openDatabase(`CREATE TABLE cases (id INTEGER PRIMARY KEY, tenant_id TEXT, subject TEXT);
   INSERT INTO cases VALUES (1, 'north', 'North renewal'), (2, 'south', 'South renewal');`);
}
export function caseById(db, actor, request) {
 const query = bind(sql`SELECT id, tenant_id, subject FROM cases WHERE tenant_id = :tenantId AND id = :id`, { tenantId: request.tenantId, id: request.id });
 return db.query(query.text, query.params).at(0) ?? null;
}
