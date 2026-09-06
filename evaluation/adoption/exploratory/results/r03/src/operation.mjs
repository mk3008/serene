import { bind } from '@mk3008/serene';
import { sql } from './sql/confirm.mjs';

export function confirmReservation(db, { tenantId, reservationId, expectedVersion, note }) {
  const parameters = { tenantId, reservationId, expectedVersion, note };
  const query = bind(sql, parameters);
  const row = db.prepare(query.text).get(parameters);
  return row ? { ...row } : null;
}
