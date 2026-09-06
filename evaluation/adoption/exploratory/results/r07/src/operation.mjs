import { bind, sql } from '@mk3008/serene';
import { sql as releaseSql } from './sql/release.mjs';
import { sql as recordSql } from './sql/record.mjs';

const begin = sql`BEGIN IMMEDIATE`;
const commit = sql`COMMIT`;
const rollback = sql`ROLLBACK`;

export function releaseSamples(db, { tenantId, sampleIds, operator }) {
  if (sampleIds.length === 0) return [];
  if (new Set(sampleIds).size !== sampleIds.length) {
    throw new Error('Duplicate sample IDs');
  }

  db.exec(bind(begin).text);
  try {
    const released = [];
    for (const sampleId of sampleIds) {
      const sampleBindings = { tenantId, sampleId };
      const update = bind(releaseSql, sampleBindings);
      const result = db.prepare(update.text).run(sampleBindings);
      if (result.changes !== 1) {
        throw new Error(`Sample is missing or not ready: ${sampleId}`);
      }

      const recordBindings = { tenantId, sampleId, operator };
      const record = bind(recordSql, recordBindings);
      db.prepare(record.text).run(recordBindings);
      released.push({ sampleId, state: 'released', operator });
    }
    db.exec(bind(commit).text);
    return released;
  } catch (error) {
    db.exec(bind(rollback).text);
    throw error;
  }
}
