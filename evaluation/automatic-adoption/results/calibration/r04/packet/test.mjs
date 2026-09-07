import assert from 'node:assert/strict';
import { byId, byRegion, openQueue, queued } from './app.mjs';
const db = openQueue();
assert.equal(byId(db, 1).region, 'east');
assert.equal(byRegion(db, 'west').length, 1);
assert.equal(queued(db).length, 1);
console.log('shipping queue checks passed');
