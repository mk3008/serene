import { bind } from '@mk3008/serene';
import { sql } from './sql/confirm.mjs';

export function confirmReservation(db, { tenantId, reservationId, expectedVersion, note }) {
  const query = bind(sql, { tenantId, reservationId, expectedVersion, note });
  const parameters = Object.fromEntries(query.names.map((name, index) => [name, query.values[index]]));
  const row = db.prepare(query.text).get(parameters);
  return row ? { ...row } : null;
}
