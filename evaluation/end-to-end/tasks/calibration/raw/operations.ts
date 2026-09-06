import type { Db, UntrustedInput } from './contracts.js';

export async function listActive(db: Db, active: string): Promise<void> {
  const statement = `
    SELECT id, label
    FROM calibration_jobs
    WHERE active = :active
    ORDER BY id
  `;
  await db.query(statement, { active: active });
}

export async function markComplete(db: Db, complete: string, jobId: string): Promise<void> {
  const statement = `
    UPDATE calibration_jobs
    SET complete = :complete
    WHERE id = :jobId
    RETURNING id
  `;
  await db.execute(statement, { complete: complete, jobId: jobId });
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
