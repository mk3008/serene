import { DatabaseSync } from 'node:sqlite';
import assert from 'node:assert/strict';
import test from 'node:test';
const schema="CREATE TABLE reservations(tenant_id TEXT NOT NULL,reservation_id TEXT NOT NULL,room TEXT NOT NULL,status TEXT NOT NULL,note TEXT NOT NULL,version INTEGER NOT NULL,PRIMARY KEY(tenant_id,reservation_id));";
const seed="INSERT INTO reservations VALUES ('studio-a','r1','Blue','pending','initial',2),('studio-b','r1','Green','pending','other',2),('studio-a','r2','Red','confirmed','fixed',4);";
function db(){const d=new DatabaseSync(':memory:');d.exec(schema);d.exec(seed);return d;}
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
if(!process.env.PILOT_TARGET)throw new Error('PILOT_TARGET is required');
const { confirmReservation }=await import(pathToFileURL(resolve(process.env.PILOT_TARGET,'src/operation.mjs')).href);
test('exact note and tenant isolation',()=>{const d=db();const note="Don't change this; $tenantId";assert.deepEqual(confirmReservation(d,{tenantId:'studio-b',reservationId:'r1',expectedVersion:2,note}),{reservationId:'r1',status:'confirmed',note,version:3});assert.equal(d.prepare("SELECT status FROM reservations WHERE tenant_id='studio-a' AND reservation_id='r1'").get().status,'pending');assert.equal(d.prepare("SELECT note FROM reservations WHERE tenant_id='studio-b' AND reservation_id='r1'").get().note,note);d.close();});
test('stale missing and nonpending are unchanged',()=>{const d=db();const before=JSON.stringify(d.prepare('SELECT * FROM reservations ORDER BY tenant_id,reservation_id').all());for(const o of [{tenantId:'studio-a',reservationId:'r1',expectedVersion:1},{tenantId:'studio-a',reservationId:'r2',expectedVersion:4},{tenantId:'studio-c',reservationId:'r1',expectedVersion:2},{tenantId:'studio-a',reservationId:'missing',expectedVersion:2}])assert.equal(confirmReservation(d,{...o,note:'bad'}),null);assert.equal(JSON.stringify(d.prepare('SELECT * FROM reservations ORDER BY tenant_id,reservation_id').all()),before);d.close();});
