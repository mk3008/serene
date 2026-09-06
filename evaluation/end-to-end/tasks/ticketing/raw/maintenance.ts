import type { Db, UntrustedInput } from './contracts.js';

export async function reopenTicket(db: Db, state: string, ticketId: string): Promise<void> {
  const statement = `
    UPDATE tickets
    SET state = :state, closed_at = NULL
    WHERE id = :ticketId
    RETURNING id
  `;
  await db.execute(statement, { state: state, ticketId: ticketId });
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
