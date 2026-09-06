import { bind, sql } from '@mk3008/serene';

import type { Db, UntrustedInput } from './contracts.js';

export async function listOpenTickets(db: Db, state: string): Promise<void> {
  const q = bind(sql`
    SELECT id, subject, priority
    FROM tickets
    WHERE state = :state
    ORDER BY created_at DESC
  `, { state: state });
  await db.query(q.text, q.params);
}

export async function findTicketById(db: Db, ticketId: string): Promise<void> {
  const q = bind(sql`
    SELECT id, subject, requester_id
    FROM tickets
    WHERE id = :ticketId
    LIMIT 1
  `, { ticketId: ticketId });
  await db.query(q.text, q.params);
}

export async function assignTicket(db: Db, agentId: string, ticketId: string): Promise<void> {
  const q = bind(sql`
    UPDATE tickets
    SET assignee_id = :agentId, assigned_at = CURRENT_TIMESTAMP
    WHERE id = :ticketId
    RETURNING id
  `, { agentId: agentId, ticketId: ticketId });
  await db.execute(q.text, q.params);
}

export async function closeResolvedTickets(db: Db, closedState: string, resolvedState: string): Promise<void> {
  const q = bind(sql`
    UPDATE tickets
    SET state = :closedState, closed_at = CURRENT_TIMESTAMP
    WHERE state = :resolvedState
    RETURNING id
  `, { closedState: closedState, resolvedState: resolvedState });
  await db.execute(q.text, q.params);
}
