import type { Db, UntrustedInput } from './contracts.js';

export async function listOpenTickets(db: Db, state: string): Promise<void> {
  const statement = `
    SELECT id, subject, priority
    FROM tickets
    WHERE state = :state
    ORDER BY created_at DESC
  `;
  await db.query(statement, { state: state });
}

export async function findTicketById(db: Db, ticketId: string): Promise<void> {
  const statement = `
    SELECT id, subject, requester_id
    FROM tickets
    WHERE id = :ticketId
    LIMIT 1
  `;
  await db.query(statement, { ticketId: ticketId });
}

export async function assignTicket(db: Db, agentId: string, ticketId: string): Promise<void> {
  const statement = `
    UPDATE tickets
    SET assignee_id = :agentId, assigned_at = CURRENT_TIMESTAMP
    WHERE id = :ticketId
    RETURNING id
  `;
  await db.execute(statement, { agentId: agentId, ticketId: ticketId });
}

export async function closeResolvedTickets(db: Db, closedState: string, resolvedState: string): Promise<void> {
  const statement = `
    UPDATE tickets
    SET state = :closedState, closed_at = CURRENT_TIMESTAMP
    WHERE state = :resolvedState
    RETURNING id
  `;
  await db.execute(statement, { closedState: closedState, resolvedState: resolvedState });
}
