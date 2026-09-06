import { bind, sql } from '@mk3008/serene';

import type { Db, UntrustedInput } from './contracts.js';

export async function loadRequesterHistory(db: Db, requesterId: string): Promise<void> {
  const q = bind(sql`
    SELECT t.id, t.subject, t.state
    FROM tickets t
    WHERE t.requester_id = :requesterId
    ORDER BY t.created_at DESC
  `, { requesterId: requesterId });
  await db.query(q.text, q.params);
}

export async function countQueueByPriority(db: Db, state: string): Promise<void> {
  const q = bind(sql`
    SELECT priority, COUNT(*) AS total
    FROM tickets
    WHERE state = :state
    GROUP BY priority
  `, { state: state });
  await db.query(q.text, q.params);
}

export async function searchTicketing(db: Db, phrase: UntrustedInput): Promise<void> {
  const statement = `
    SELECT id, subject
    FROM ticketing
    WHERE subject ILIKE '%` + phrase + `%'
  `;
  await db.query(statement);
}
