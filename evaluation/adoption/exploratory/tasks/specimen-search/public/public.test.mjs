import { DatabaseSync } from 'node:sqlite';
import assert from 'node:assert/strict';
import test from 'node:test';
const schema="CREATE TABLE specimens(tenant_id TEXT NOT NULL, specimen_id TEXT NOT NULL, label TEXT NOT NULL, category TEXT NOT NULL, collected_at TEXT NOT NULL, archived INTEGER NOT NULL, PRIMARY KEY(tenant_id,specimen_id));";
const seed="INSERT INTO specimens VALUES ('museum-a','s1','Amber','mineral','2026-01-02',0),('museum-a','s2','Basalt','mineral','2026-01-02',0),('museum-a','s3','Old quartz','mineral','2026-01-04',1),('museum-a','s4','Fern','plant','2026-01-05',0),('museum-b','s1','Other amber','mineral','2026-01-06',0);";
function db(){const d=new DatabaseSync(':memory:');d.exec(schema);d.exec(seed);return d;}
import { findSpecimens } from './src/operation.mjs';
test('filters and orders specimens',()=>{const d=db();assert.deepEqual(findSpecimens(d,{tenantId:'museum-a',category:'mineral',since:'2026-01-02',limit:2}),[{specimenId:'s1',label:'Amber',collectedAt:'2026-01-02'},{specimenId:'s2',label:'Basalt',collectedAt:'2026-01-02'}]);d.close();});
