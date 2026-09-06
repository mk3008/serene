import { sql } from '@mk3008/serene';

export const confirmSql = sql`
  UPDATE reservations
  SET status = 'confirmed', note = :note, version = version + 1
  WHERE tenant_id = :tenantId
    AND reservation_id = :reservationId
    AND version = :expectedVersion
    AND status = 'pending'
  RETURNING reservation_id AS reservationId, status, note, version
`;
