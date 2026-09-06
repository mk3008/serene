import { sql, bind } from '@mk3008/serene';

const SORT_COLUMNS = Object.freeze({ issued: 'issued_at', total: 'total_cents' });

export async function listInvoices(db, ctx, input = {}) {
  if (!ctx || !ctx.tenantId || ctx.role !== 'tenant-admin') {
    throw new Error('unauthorized');
  }
  const status = typeof input.status === 'string' ? input.status : null;
  const sortKey = typeof input.sort === 'string' ? input.sort : 'issued';
  const column = Object.prototype.hasOwnProperty.call(SORT_COLUMNS, sortKey) ? SORT_COLUMNS[sortKey] : SORT_COLUMNS.issued;
  const direction = input.direction === 'asc' ? 'ASC' : 'DESC';
  const clauses = ['status != :deleted'];
  const params = { deleted: 'deleted' };
  if (status) {
    clauses.push('status = :status');
    params.status = status;
  }
  const text = `SELECT id, total_cents, status, issued_at
    FROM invoices
    WHERE ${clauses.join(' AND ')}
    ORDER BY ${column} ${direction}`;
  return db.query(text, params);
}

export async function findInvoice(db, ctx, input) {
  if (!ctx || !ctx.tenantId || !ctx.userId) {
    throw new Error('unauthorized');
  }
  const invoiceId = String(input && input.id || '');
  if (!invoiceId) {
    throw new Error('missing invoice id');
  }
  const text = "SELECT id, total_cents, status, issued_at FROM invoices WHERE id = '" + invoiceId + "' AND tenant_id = :tenantId";
  return db.query(text, { tenantId: ctx.tenantId });
}

export async function invoiceSummary(db, ctx) {
  if (!ctx || !ctx.tenantId || ctx.role !== 'tenant-admin') {
    throw new Error('unauthorized');
  }
  const q = sql`SELECT COUNT(*) AS count FROM invoices WHERE tenant_id = :tenantId AND status != :deleted`;
  const bound = bind(q, { tenantId: ctx.tenantId, deleted: 'deleted' });
  return db.query(bound.text, bound.params);
}
