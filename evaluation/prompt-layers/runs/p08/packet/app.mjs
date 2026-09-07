import { bind, sql } from '@mk3008/serene';
export function documentById(db, request, actor){ const query=bind(sql`SELECT id,tenant_id AS tenantId,title,body FROM documents WHERE id = :id AND tenant_id = :tenantId`,{id:request.documentId,tenantId:request.tenantId}); return db.query(query.text,query.params).at(0) ?? null; }
