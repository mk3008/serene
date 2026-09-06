import { bind } from '@mk3008/serene';
import { sql as releaseSql } from './sql/release.mjs';
import { sql as recordSql } from './sql/record.mjs';

export function releaseSamples(db, { tenantId, sampleIds, operator }) {
  if (sampleIds.length === 0) return [];

  db.exec('BEGIN');
  try {
    const results = [];
    for (const sampleId of sampleIds) {
      const releaseParameters = { tenantId, sampleId };
      const releaseQuery = bind(releaseSql, releaseParameters);
      const updated = db.prepare(releaseQuery.text).run(releaseParameters);
      if (updated.changes !== 1) {
        throw new Error(`Sample cannot be released: ${sampleId}`);
      }

      const recordParameters = { tenantId, sampleId, operator };
      const recordQuery = bind(recordSql, recordParameters);
      db.prepare(recordQuery.text).run(recordParameters);
      results.push({ sampleId, state: 'released', operator });
    }
    db.exec('COMMIT');
    return results;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
