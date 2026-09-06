import { sql as statement } from '@mk3008/serene';

export const sql = statement`
  UPDATE reservations
  SET status = 'confirmed', note = :note, version = version + 1
  WHERE tenant_id = :tenantId
    AND reservation_id = :reservationId
    AND version = :expectedVersion
    AND status = 'pending'
  RETURNING reservation_id AS reservationId, status, note, version
`;
