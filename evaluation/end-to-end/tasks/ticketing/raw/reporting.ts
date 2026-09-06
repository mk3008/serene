import type { Db, UntrustedInput } from './contracts.js';

export async function loadRequesterHistory(db: Db, requesterId: string): Promise<void> {
  const statement = `
    SELECT t.id, t.subject, t.state
    FROM tickets t
    WHERE t.requester_id = :requesterId
    ORDER BY t.created_at DESC
  `;
  await db.query(statement, { requesterId: requesterId });
}

export async function countQueueByPriority(db: Db, state: string): Promise<void> {
  const statement = `
    SELECT priority, COUNT(*) AS total
    FROM tickets
    WHERE state = :state
    GROUP BY priority
  `;
  await db.query(statement, { state: state });
}

export async function searchTicketing(db: Db, phrase: UntrustedInput): Promise<void> {
  const statement = `
    SELECT id, subject
    FROM ticketing
    WHERE subject ILIKE '%` + phrase + `%'
  `;
  await db.query(statement);
}
