import { sql, bind } from '@mk3008/serene';

const specimenSearch = sql`
  SELECT specimen_id AS specimenId, label, collected_at AS collectedAt
  FROM specimens
  WHERE tenant_id = :tenantId
    AND category = :category
    AND collected_at >= :since
    AND archived = 0
  ORDER BY collected_at DESC, specimen_id ASC
  LIMIT :limit
`;

export function findSpecimens(db, { tenantId, category, since, limit }) {
  const parameters = { tenantId, category, since, limit };
  const query = bind(specimenSearch, parameters);
  return db.prepare(query.text).all(parameters).map(
    ({ specimenId, label, collectedAt }) => ({ specimenId, label, collectedAt }),
  );
}
