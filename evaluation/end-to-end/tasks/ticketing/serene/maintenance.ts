import { bind, sql } from '@mk3008/serene';

import type { Db, UntrustedInput } from './contracts.js';

export async function reopenTicket(db: Db, state: string, ticketId: string): Promise<void> {
  const q = bind(sql`
    UPDATE tickets
    SET state = :state, closed_at = NULL
    WHERE id = :ticketId
    RETURNING id
  `, { state: state, ticketId: ticketId });
  await db.execute(q.text, q.params);
}

export async function purgeTicketingPreview(db: Db): Promise<void> {
  await db.execute(`
    DELETE FROM tickets_preview
    WHERE expires_at < CURRENT_TIMESTAMP
    RETURNING id
  `);
}

export async function sendTicketingSnapshot(db: Db): Promise<void> {
  await db.sendSql(`
    SELECT id, created_at
    FROM tickets
    WHERE archived = false
  `);
}
