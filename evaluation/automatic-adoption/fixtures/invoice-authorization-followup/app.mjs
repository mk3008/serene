import { bind, sql } from '@mk3008/serene';
import { openDatabase } from './database.mjs';

export function openInvoices() {
 return openDatabase(`CREATE TABLE invoices (id INTEGER PRIMARY KEY, tenant_id TEXT, amount INTEGER);
   INSERT INTO invoices VALUES (41, 'cedar', 300), (42, 'maple', 510);`);
}
export function invoiceById(db, actor, request) {
 const query = bind(sql`SELECT id, tenant_id, amount FROM invoices WHERE tenant_id = :tenantId AND id = :id`, { tenantId: request.tenantId, id: request.id });
 return db.query(query.text, query.params).at(0) ?? null;
}
