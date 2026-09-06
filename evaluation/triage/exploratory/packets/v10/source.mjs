import { sql, bind } from '@mk3008/serene';

export async function setSubscriptionState(db, ctx, input) {
  if (!ctx || !ctx.tenantId || ctx.role !== 'tenant-admin') {
    throw new Error('unauthorized');
  }
  const subscriptionId = String(input && input.subscriptionId || '');
  const requested = input && input.state;
  if (!subscriptionId || (requested !== 'active' && requested !== 'suspended')) {
    throw new Error('invalid request');
  }
  const update = sql`UPDATE subscriptions
    SET state = :state, updated_at = :updatedAt
    WHERE id = :subscriptionId AND tenant_id = :tenantId`;
  const params = {
    state: requested === 'active' ? 'enabled' : 'suspended',
    updatedAt: new Date().toISOString(),
    subscriptionId,
    tenantId: ctx.tenantId
  };
  const boundUpdate = bind(update, params);
  await db.query(boundUpdate.text, boundUpdate.params);
  const read = sql`SELECT id, state, updated_at FROM subscriptions
    WHERE id = :subscriptionId AND tenant_id = :tenantId`;
  const boundRead = bind(read, { subscriptionId, tenantId: ctx.tenantId });
  return db.query(boundRead.text, boundRead.params);
}

export async function subscriptionHistory(db, ctx, input = {}) {
  if (!ctx || !ctx.tenantId || !ctx.userId) {
    throw new Error('unauthorized');
  }
  const requestedLimit = Number.isInteger(input.limit) && input.limit > 0 ? input.limit : 50;
  const q = sql`SELECT event, state, created_at FROM subscription_events
    WHERE tenant_id = :tenantId ORDER BY created_at DESC LIMIT :limit`;
  const bound = bind(q, { tenantId: ctx.tenantId, limit: requestedLimit });
  return db.query(bound.text, bound.params);
}

export async function subscriptionCount(db, ctx) {
  if (!ctx || !ctx.tenantId) throw new Error('unauthorized');
  const q = sql`SELECT COUNT(*) AS count FROM subscriptions WHERE tenant_id = :tenantId`;
  const bound = bind(q, { tenantId: ctx.tenantId });
  return db.query(bound.text, bound.params);
}
