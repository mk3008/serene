export async function setSubscriptionState(db, ctx, input) {
  if (!ctx || !ctx.tenantId || ctx.role !== 'tenant-admin') {
    throw new Error('unauthorized');
  }
  const subscriptionId = String(input && input.subscriptionId || '');
  const requested = input && input.state;
  if (!subscriptionId || (requested !== 'active' && requested !== 'suspended')) {
    throw new Error('invalid request');
  }
  const update = `UPDATE subscriptions
    SET state = :state, updated_at = :updatedAt
    WHERE id = :subscriptionId AND tenant_id = :tenantId`;
  const params = {
    state: requested === 'active' ? 'enabled' : 'suspended',
    updatedAt: new Date().toISOString(),
    subscriptionId,
    tenantId: ctx.tenantId
  };
  await db.query(update, params);
  const read = `SELECT id, state, updated_at FROM subscriptions
    WHERE id = :subscriptionId AND tenant_id = :tenantId`;
  return db.query(read, { subscriptionId, tenantId: ctx.tenantId });
}

export async function subscriptionHistory(db, ctx, input = {}) {
  if (!ctx || !ctx.tenantId || !ctx.userId) {
    throw new Error('unauthorized');
  }
  const requestedLimit = Number.isInteger(input.limit) && input.limit > 0 ? input.limit : 50;
  const text = `SELECT event, state, created_at FROM subscription_events
    WHERE tenant_id = :tenantId ORDER BY created_at DESC LIMIT :limit`;
  return db.query(text, { tenantId: ctx.tenantId, limit: requestedLimit });
}

export async function subscriptionCount(db, ctx) {
  if (!ctx || !ctx.tenantId) throw new Error('unauthorized');
  const text = 'SELECT COUNT(*) AS count FROM subscriptions WHERE tenant_id = :tenantId';
  return db.query(text, { tenantId: ctx.tenantId });
}
