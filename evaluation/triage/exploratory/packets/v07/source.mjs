import { sql, bind, sort, orderBy } from '@mk3008/serene';

const ORDER = Object.freeze({
  name: sort`name ASC`,
  newest: sort`created_at DESC`
});

export async function listProjects(db, ctx, input = {}) {
  if (!ctx || !ctx.tenantId || !ctx.userId) throw new Error('unauthorized');
  const orderKey = input.order === 'name' || input.order === 'newest' ? input.order : 'newest';
  if (typeof input.archived === 'boolean') {
    const base = sql`SELECT id, name, archived, created_at FROM projects
      WHERE tenant_id = :tenantId AND archived = :archived`;
    const ordered = orderBy(base, ORDER, orderKey);
    const bound = bind(ordered, { tenantId: ctx.tenantId, archived: input.archived ? 1 : 0 });
    return db.query(bound.text, bound.params);
  }
  const base = sql`SELECT id, name, archived, created_at FROM projects
    WHERE tenant_id = :tenantId`;
  const ordered = orderBy(base, ORDER, orderKey);
  const bound = bind(ordered, { tenantId: ctx.tenantId });
  return db.query(bound.text, bound.params);
}

export async function projectById(db, ctx, input) {
  if (!ctx || !ctx.tenantId || !ctx.userId) throw new Error('unauthorized');
  const id = String(input && input.id || '');
  if (!id) throw new Error('missing project id');
  const q = sql`SELECT id, name, archived, created_at FROM projects
    WHERE id = :id AND tenant_id = :tenantId`;
  const bound = bind(q, { id, tenantId: ctx.tenantId });
  return db.query(bound.text, bound.params);
}

export async function projectTotals(db, ctx) {
  if (!ctx || !ctx.tenantId || !ctx.userId) throw new Error('unauthorized');
  const q = sql`SELECT COUNT(*) AS count, COALESCE(SUM(budget_cents), 0) AS budget
    FROM projects WHERE tenant_id = :tenantId`;
  const bound = bind(q, { tenantId: ctx.tenantId });
  return db.query(bound.text, bound.params);
}

export async function visibleProjectNames(db, ctx) {
  if (!ctx || !ctx.tenantId || !ctx.userId) throw new Error('unauthorized');
  const q = sql`SELECT name FROM projects WHERE tenant_id = :tenantId AND archived = 0 ORDER BY name ASC`;
  const bound = bind(q, { tenantId: ctx.tenantId });
  return db.query(bound.text, bound.params);
}
