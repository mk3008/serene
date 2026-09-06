import { DatabaseSync } from 'node:sqlite';
import assert from 'node:assert/strict';
import test from 'node:test';
const schema="CREATE TABLE reservations(tenant_id TEXT NOT NULL,reservation_id TEXT NOT NULL,room TEXT NOT NULL,status TEXT NOT NULL,note TEXT NOT NULL,version INTEGER NOT NULL,PRIMARY KEY(tenant_id,reservation_id));";
const seed="INSERT INTO reservations VALUES ('studio-a','r1','Blue','pending','initial',2),('studio-b','r1','Green','pending','other',2),('studio-a','r2','Red','confirmed','fixed',4);";
function db(){const d=new DatabaseSync(':memory:');d.exec(schema);d.exec(seed);return d;}
import { confirmReservation } from './src/operation.mjs';
test('confirms a pending reservation',()=>{const d=db();assert.deepEqual(confirmReservation(d,{tenantId:'studio-a',reservationId:'r1',expectedVersion:2,note:'Bring easels'}),{reservationId:'r1',status:'confirmed',note:'Bring easels',version:3});d.close();});
