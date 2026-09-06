import { bind } from '@mk3008/serene';
import { confirmSql } from './sql/confirm.mjs';

export function confirmReservation(db, { tenantId, reservationId, expectedVersion, note }) {
  const query = bind(confirmSql, { tenantId, reservationId, expectedVersion, note });
  const parameters = Object.fromEntries(query.names.map((name, i) => [name, query.values[i]]));
  const row = db.prepare(query.text).get(parameters);
  return row ? { ...row } : null;
}
