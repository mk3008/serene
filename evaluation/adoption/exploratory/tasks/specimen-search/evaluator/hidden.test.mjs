import { DatabaseSync } from 'node:sqlite';
import assert from 'node:assert/strict';
import test from 'node:test';
const schema="CREATE TABLE specimens(tenant_id TEXT NOT NULL, specimen_id TEXT NOT NULL, label TEXT NOT NULL, category TEXT NOT NULL, collected_at TEXT NOT NULL, archived INTEGER NOT NULL, PRIMARY KEY(tenant_id,specimen_id));";
const seed="INSERT INTO specimens VALUES ('museum-a','s1','Amber','mineral','2026-01-02',0),('museum-a','s2','Basalt','mineral','2026-01-02',0),('museum-a','s3','Old quartz','mineral','2026-01-04',1),('museum-a','s4','Fern','plant','2026-01-05',0),('museum-b','s1','Other amber','mineral','2026-01-06',0);";
function db(){const d=new DatabaseSync(':memory:');d.exec(schema);d.exec(seed);return d;}
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
if(!process.env.PILOT_TARGET)throw new Error('PILOT_TARGET is required');
const { findSpecimens }=await import(pathToFileURL(resolve(process.env.PILOT_TARGET,'src/operation.mjs')).href);
test('exact tenant and category, inclusive date and limit',()=>{const d=db();d.exec("INSERT INTO specimens VALUES ('museum-a','s0','Recent','mineral','2026-01-03',0),('museum-a','s9','Earlier','mineral','2025-12-01',0),('museum-a','x','Odd','mineral'' OR 1=1 --','2026-01-03',0)");assert.deepEqual(findSpecimens(d,{tenantId:'museum-a',category:'mineral',since:'2026-01-02',limit:1}),[{specimenId:'s0',label:'Recent',collectedAt:'2026-01-03'}]);assert.deepEqual(findSpecimens(d,{tenantId:'museum-b',category:'mineral',since:'2026-01-01',limit:9}),[{specimenId:'s1',label:'Other amber',collectedAt:'2026-01-06'}]);assert.deepEqual(findSpecimens(d,{tenantId:'museum-a',category:"mineral' OR 1=1 --",since:'2026-01-03',limit:9}),[{specimenId:'x',label:'Odd',collectedAt:'2026-01-03'}]);d.close();});
test('no results and tie ordering',()=>{const d=db();assert.deepEqual(findSpecimens(d,{tenantId:'absent',category:'mineral',since:'2020-01-01',limit:10}),[]);assert.deepEqual(findSpecimens(d,{tenantId:'museum-a',category:'mineral',since:'2026-01-02',limit:1}).map(x=>x.specimenId),['s1']);d.close();});
