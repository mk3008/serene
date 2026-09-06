import {sql as releaseSql} from './sql/release.mjs';
import {sql as recordSql} from './sql/record.mjs';
export function releaseSamples(db,{tenantId,sampleIds,operator}) {
 if(!sampleIds.length)return [];
 db.exec('BEGIN IMMEDIATE');
 try {const out=[];for(const sampleId of sampleIds){const r=db.prepare(releaseSql).get({$tenantId:tenantId,$sampleId:sampleId});if(!r)throw new Error('Sample unavailable');db.prepare(recordSql).run({$tenantId:tenantId,$sampleId:sampleId,$operator:operator});out.push({sampleId,state:'released',operator});}db.exec('COMMIT');return out;}catch(e){db.exec('ROLLBACK');throw e;}
}
