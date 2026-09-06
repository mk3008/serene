import { bind } from '@mk3008/serene';
import { sql as releaseSql } from './sql/release.mjs';
import { sql as recordSql } from './sql/record.mjs';

export function releaseSamples(db, { tenantId, sampleIds, operator }) {
  if (sampleIds.length === 0) return [];
  if (new Set(sampleIds).size !== sampleIds.length) {
    throw new Error('Duplicate sample IDs cannot be released');
  }

  db.exec('BEGIN IMMEDIATE');
  try {
    const results = [];
    for (const sampleId of sampleIds) {
      const release = bind(releaseSql, { tenantId, sampleId });
      const updated = db.prepare(release.text).run(release.params);
      if (updated.changes !== 1) {
        throw new Error(`Sample ${sampleId} is missing or not ready`);
      }
      const record = bind(recordSql, { tenantId, sampleId, operator });
      db.prepare(record.text).run(record.params);
      results.push({ sampleId, state: 'released', operator });
    }
    db.exec('COMMIT');
    return results;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
