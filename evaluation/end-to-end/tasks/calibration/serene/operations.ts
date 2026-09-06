import { bind, sql } from '@mk3008/serene';

import type { Db, UntrustedInput } from './contracts.js';

export async function listActive(db: Db, active: string): Promise<void> {
  const q = bind(sql`
    SELECT id, label
    FROM calibration_jobs
    WHERE active = :active
    ORDER BY id
  `, { active: active });
  await db.query(q.text, q.params);
}

export async function markComplete(db: Db, complete: string, jobId: string): Promise<void> {
  const q = bind(sql`
    UPDATE calibration_jobs
    SET complete = :complete
    WHERE id = :jobId
    RETURNING id
  `, { complete: complete, jobId: jobId });
  await db.execute(q.text, q.params);
}

export async function searchCalibration(db: Db, phrase: UntrustedInput): Promise<void> {
  const statement = `
    SELECT id, label
    FROM calibration
    WHERE label ILIKE '%` + phrase + `%'
  `;
  await db.query(statement);
}

export async function sendCalibrationSnapshot(db: Db): Promise<void> {
  await db.sendSql(`
    SELECT id, created_at
    FROM calibration_jobs
    WHERE archived = false
  `);
}
