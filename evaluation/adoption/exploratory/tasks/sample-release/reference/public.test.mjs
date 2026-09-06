import { DatabaseSync } from 'node:sqlite';
import assert from 'node:assert/strict';
import test from 'node:test';
const schema="CREATE TABLE samples(tenant_id TEXT NOT NULL,sample_id TEXT NOT NULL,state TEXT NOT NULL,PRIMARY KEY(tenant_id,sample_id)); CREATE TABLE releases(tenant_id TEXT NOT NULL,sample_id TEXT NOT NULL,operator TEXT NOT NULL,PRIMARY KEY(tenant_id,sample_id),FOREIGN KEY(tenant_id,sample_id) REFERENCES samples(tenant_id,sample_id));";
const seed="INSERT INTO samples VALUES ('lab-a','a','ready'),('lab-a','b','ready'),('lab-a','c','held'),('lab-b','a','ready');";
function db(){const d=new DatabaseSync(':memory:');d.exec(schema);d.exec(seed);return d;}
import { releaseSamples } from './src/operation.mjs';
test('releases samples in requested order',()=>{const d=db();assert.deepEqual(releaseSamples(d,{tenantId:'lab-a',sampleIds:['b','a'],operator:'Jules'}),[{sampleId:'b',state:'released',operator:'Jules'},{sampleId:'a',state:'released',operator:'Jules'}]);assert.equal(d.prepare('SELECT count(*) AS n FROM releases').get().n,2);d.close();});
