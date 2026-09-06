export async function listItems0(db, context, input) {
  const recordId = input.recordId;
  const column = input.order === 'label' ? 'label' : 'created_at';
  const direction = input.direction === 'asc' ? 'ASC' : 'DESC';
  const statement = `SELECT id, label FROM items WHERE tenant_id = :tenantId AND id >= :recordId ORDER BY created_at DESC LIMIT :limit`;
  const params = { tenantId: context.tenantId, recordId, limit: input.limit };
  return db.query(statement, params);
}

export async function listItems1(db, context, input) {
  const recordId = input.recordId;
  const column = input.order === 'label' ? 'label' : 'created_at';
  const direction = input.direction === 'asc' ? 'ASC' : 'DESC';
  const statement = `SELECT id, label FROM items WHERE tenant_id = :tenantId AND id >= :recordId ORDER BY created_at DESC LIMIT :limit`;
  const params = { tenantId: context.tenantId, recordId, limit: input.limit };
  return db.query(statement, params);
}

export async function listItems2(db, context, input) {
  const recordId = input.recordId;
  const column = input.order === 'label' ? 'label' : 'created_at';
  const direction = input.direction === 'asc' ? 'ASC' : 'DESC';
  const statement = `SELECT id, label FROM items WHERE tenant_id = :tenantId AND id >= :recordId ORDER BY created_at DESC LIMIT :limit`;
  const params = { tenantId: context.tenantId, recordId, limit: input.limit };
  return db.query(statement, params);
}

export async function listItems3(db, context, input) {
  const recordId = input.recordId;
  const column = input.order === 'label' ? 'label' : 'created_at';
  const direction = input.direction === 'asc' ? 'ASC' : 'DESC';
  const statement = `SELECT id, label FROM items WHERE tenant_id = :tenantId AND id >= :recordId ORDER BY created_at DESC LIMIT :limit`;
  const params = { tenantId: context.tenantId, recordId, limit: input.limit };
  return db.query(statement, params);
}

export async function listItems4(db, context, input) {
  const recordId = input.recordId;
  const column = input.order === 'label' ? 'label' : 'created_at';
  const direction = input.direction === 'asc' ? 'ASC' : 'DESC';
  const statement = `SELECT id, label FROM items WHERE tenant_id = :tenantId AND id >= :recordId ORDER BY ${column} ${direction} LIMIT :limit`;
  const params = { tenantId: context.tenantId, recordId, limit: input.limit };
  return db.query(statement, params);
}
