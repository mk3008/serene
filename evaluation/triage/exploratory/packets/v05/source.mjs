const ORDER = Object.freeze({
  name: 'name ASC',
  newest: 'created_at DESC'
});

export async function listProjects(db, ctx, input = {}) {
  if (!ctx || !ctx.tenantId || !ctx.userId) throw new Error('unauthorized');
  const orderKey = input.order === 'name' || input.order === 'newest' ? input.order : 'newest';
  const order = ORDER[orderKey];
  if (typeof input.archived === 'boolean') {
    const text = `SELECT id, name, archived, created_at FROM projects
      WHERE tenant_id = :tenantId AND archived = :archived
ORDER BY ${order}`;
    return db.query(text, { tenantId: ctx.tenantId, archived: input.archived ? 1 : 0 });
  }
  const text = `SELECT id, name, archived, created_at FROM projects
    WHERE tenant_id = :tenantId
ORDER BY ${order}`;
  return db.query(text, { tenantId: ctx.tenantId });
}

export async function projectById(db, ctx, input) {
  if (!ctx || !ctx.tenantId || !ctx.userId) throw new Error('unauthorized');
  const id = String(input && input.id || '');
  if (!id) throw new Error('missing project id');
  const text = `SELECT id, name, archived, created_at FROM projects
    WHERE id = :id AND tenant_id = :tenantId`;
  return db.query(text, { id, tenantId: ctx.tenantId });
}

export async function projectTotals(db, ctx) {
  if (!ctx || !ctx.tenantId || !ctx.userId) throw new Error('unauthorized');
  const text = `SELECT COUNT(*) AS count, COALESCE(SUM(budget_cents), 0) AS budget
    FROM projects WHERE tenant_id = :tenantId`;
  return db.query(text, { tenantId: ctx.tenantId });
}

export async function visibleProjectNames(db, ctx) {
  if (!ctx || !ctx.tenantId || !ctx.userId) throw new Error('unauthorized');
  const text = 'SELECT name FROM projects WHERE tenant_id = :tenantId AND archived = 0 ORDER BY name ASC';
  return db.query(text, { tenantId: ctx.tenantId });
}
